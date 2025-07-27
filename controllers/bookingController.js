// mi-proyecto-reservas-backend/controllers/bookingController.js
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User'); // Importamos el modelo User para populate

// Helper para verificar solapamiento de fechas (no se usa directamente en este controlador para la validación principal,
// pero es útil para lógica de calendario/UI o validación de BD más compleja)
const isOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
};

// @desc    Crear una nueva reserva
// @route   POST /api/bookings
// @access  Private (requiere autenticación)
exports.createBooking = async (req, res) => {
    const { propertyId, checkInDate, checkOutDate, guests } = req.body;
    const userId = req.user._id; // ID del usuario que hace la reserva (desde el token JWT)

    // Convertir fechas a objetos Date y asegurarse de que sean el inicio del día para comparaciones
    const parsedCheckInDate = new Date(checkInDate);
    parsedCheckInDate.setHours(0, 0, 0, 0); // Inicio del día
    const parsedCheckOutDate = new Date(checkOutDate);
    parsedCheckOutDate.setHours(0, 0, 0, 0); // Inicio del día

    // Validación básica de fechas
    if (parsedCheckInDate >= parsedCheckOutDate) {
        return res.status(400).json({ message: 'La fecha de salida debe ser posterior a la fecha de entrada.' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedCheckInDate < today) { // No permitir reservas en el pasado
        return res.status(400).json({ message: 'No puedes reservar en el pasado.' });
    }

    try {
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Propiedad no encontrada.' });
        }

        // 1. Verificar disponibilidad de la propiedad
        // Busca reservas existentes para esta propiedad que se solapen con las fechas solicitadas
        const overlappingBookings = await Booking.find({
            property: propertyId,
            status: { $in: ['pending', 'confirmed'] }, // Considerar solo reservas activas
            $or: [
                // Caso 1: La nueva reserva empieza dentro de una reserva existente
                { checkInDate: { $lt: parsedCheckOutDate }, checkInDate: { $gte: parsedCheckInDate } },
                // Caso 2: La nueva reserva termina dentro de una reserva existente
                { checkOutDate: { $gt: parsedCheckInDate }, checkOutDate: { $lte: parsedCheckOutDate } },
                // Caso 3: Una reserva existente está completamente dentro de la nueva reserva
                { checkInDate: { $gte: parsedCheckInDate }, checkOutDate: { $lte: parsedCheckOutDate } },
                // Caso 4: La nueva reserva está completamente dentro de una reserva existente
                { checkInDate: { $lte: parsedCheckInDate }, checkOutDate: { $gte: parsedCheckOutDate } }
            ]
        });

        if (overlappingBookings.length > 0) {
            console.log('DEBUG: Solapamiento de reservas encontrado:', overlappingBookings); // Para depuración
            return res.status(409).json({ message: 'Lo sentimos, las fechas seleccionadas no están disponibles.' });
        }

        // 2. Verificar que el número de huéspedes no exceda la capacidad de la propiedad
        if (guests > property.guests) {
            return res.status(400).json({ message: `El número de huéspedes (${guests}) excede la capacidad máxima de la propiedad (${property.guests}).` });
        }

        // 3. Calcular el precio total (número de noches)
        const diffTime = Math.abs(parsedCheckOutDate.getTime() - parsedCheckInDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Redondea hacia arriba para asegurar noches completas
        const totalPrice = diffDays * property.pricePerNight;

        // 4. Crear la reserva
        const booking = new Booking({
            property: propertyId,
            user: userId,
            checkInDate: parsedCheckInDate,
            checkOutDate: parsedCheckOutDate,
            totalPrice,
            guests,
            status: 'pending' // Estado inicial de la reserva
        });

        const savedBooking = await booking.save();
        res.status(201).json(savedBooking);

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear la reserva.' });
    }
};

// @desc    Obtener todas las reservas de un usuario (Mis Reservas)
// @route   GET /api/bookings/my
// @access  Private (requiere autenticación)
exports.getMyBookings = async (req, res) => {
    try {
        // Buscar reservas por el ID del usuario autenticado, y popular la información de la propiedad
        // .populate('property') es crucial para que frontend acceda a property.title, property.location, etc.
        const bookings = await Booking.find({ user: req.user._id }).populate('property').sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error al obtener mis reservas:', error);
        res.status(500).json({ message: 'Error del servidor al obtener las reservas.' });
    }
};

// @desc    Obtener todas las reservas de una propiedad (para el propietario/admin)
// @route   GET /api/bookings/property/:propertyId
// @access  Private (requiere autenticación, solo admin o propietario)
exports.getPropertyBookings = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({ message: 'Propiedad no encontrada.' });
        }

        // Verificar si el usuario es el propietario de la propiedad o un admin
        if (req.user.role !== 'admin' && (!property.owner || property.owner.toString() !== req.user.id.toString())) {
             return res.status(403).json({ message: 'No autorizado para ver las reservas de esta propiedad.' });
        }

        // Popula el usuario que hizo la reserva (nombre y email) y la propiedad
        const bookings = await Booking.find({ property: propertyId })
                                      .populate('user', 'name email') // Popula solo nombre y email del usuario
                                      .populate('property') // Popula la propiedad
                                      .sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente
        res.status(200).json(bookings);

    } catch (error) {
        console.error('Error al obtener reservas de la propiedad:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de propiedad inválido.' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener reservas de la propiedad.' });
    }
};


// @desc    Cancelar una reserva
// @route   PUT /api/bookings/:id/cancel
// @access  Private (solo el usuario que hizo la reserva o un admin puede cancelar)
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('property'); // Popula la propiedad para verificación de owner
        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }

        // Verificar si el usuario es el que hizo la reserva o un admin
        if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id.toString()) {
            // Si no es admin, verificar si es el propietario de la propiedad
            if (!booking.property.owner || booking.property.owner.toString() !== req.user.id.toString()) {
                return res.status(403).json({ message: 'No autorizado para cancelar esta reserva.' });
            }
        }
        
        // Solo permitir cancelar si el estado no es ya cancelado o completado
        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return res.status(400).json({ message: `La reserva ya está ${booking.status}. No se puede cancelar.` });
        }

        booking.status = 'cancelled';
        await booking.save();
        res.status(200).json({ message: 'Reserva cancelada exitosamente.', booking });

    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de reserva inválido.' });
        }
        res.status(500).json({ message: 'Error del servidor al cancelar la reserva.' });
    }
};

// @desc    Actualizar el estado de una reserva (ej. a 'confirmed', 'completed', 'cancelled')
// @route   PUT /api/bookings/:id/status
// @access  Private (solo admin o el propietario de la propiedad)
exports.updateBookingStatus = async (req, res) => {
    const { status } = req.body; // El nuevo estado (ej. 'confirmed', 'completed')
    const bookingId = req.params.id;

    try {
        const booking = await Booking.findById(bookingId).populate('property'); // Popula la propiedad para verificar propietario
        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }

        // Verificar autorización: El usuario logueado debe ser un admin O el propietario de la propiedad reservada.
        if (req.user.role !== 'admin' && (!booking.property.owner || booking.property.owner.toString() !== req.user.id.toString())) {
             return res.status(403).json({ message: 'No autorizado para cambiar el estado de esta reserva.' });
        }

        // Validar que el nuevo estado sea uno permitido y la transición sea lógica
        const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Estado de reserva inválido.' });
        }

        // Lógica de transiciones de estado:
        if (booking.status === 'cancelled' && (status === 'pending' || status === 'confirmed')) {
            return res.status(400).json({ message: 'No se puede cambiar el estado de una reserva cancelada a pendiente o confirmada.' });
        }
        if (booking.status === 'completed' && (status === 'pending' || status === 'confirmed' || status === 'cancelled')) {
             return res.status(400).json({ message: 'No se puede cambiar el estado de una reserva completada.' });
        }
        // Puedes añadir más reglas, ej. 'confirmed' solo desde 'pending'

        booking.status = status;
        await booking.save();
        res.status(200).json({ message: `Estado de reserva actualizado a ${status}.`, booking });

    } catch (error) {
        console.error('Error al actualizar estado de reserva:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de reserva inválido.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar el estado de la reserva.' });
    }
};


// @desc    Obtener fechas ocupadas de una propiedad
// @route   GET /api/bookings/property/:propertyId/occupied-dates
// @access  Public
exports.getOccupiedDates = async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        const bookings = await Booking.find({
            property: propertyId,
            status: { $in: ['pending', 'confirmed'] } // Solo fechas de reservas activas
        }).select('checkInDate checkOutDate'); // Selecciona solo los campos de fechas

        const occupiedRanges = bookings.map(booking => ({
            start: booking.checkInDate,
            end: booking.checkOutDate
        }));

        res.status(200).json(occupiedRanges);
    } catch (error) {
        console.error('Error al obtener fechas ocupadas:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'ID de propiedad inválido.' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener fechas ocupadas.' });
    }
};