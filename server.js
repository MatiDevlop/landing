// server.js
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import loadUsers from './loadUsers.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Usa una variable de entorno en producción
const JWT_SECRET = process.env.JWT_SECRET || 'cambia_este_secreto';

// Array global de usuarios, cargado desde el XLSX
let users = [];

/**
 * Middleware de autenticación y autorización basado en JWT y roles.
 * Extrae el token de la cookie "token", lo verifica y comprueba roles.
 * 
 * @param {string[]} [requiredRoles=[]] - Roles permitidos (ej: ['Presidenta','Vicepresidente'])
 * @returns {import('express').RequestHandler} Middleware de Express
 */
function auth(requiredRoles = []) {
  return (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (requiredRoles.length && !requiredRoles.includes(payload.rol)) {
        return res.status(403).json({ error: 'No autorizado' });
      }
      req.user = payload; // { matricula, rol, iat, exp }
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}

/**
 * Función principal que carga los usuarios y arranca el servidor Express.
 * 
 * @async
 * @function
 */
async function main() {
  try {
    // 1) Cargar usuarios desde Excel
    users = await loadUsers();
    console.log(`Usuarios cargados: ${users.length}`);
    console.log('Primeras matrículas:', users.slice(0, 10).map(u => u.matricula));

    /**
     * Ruta de login que recibe una matrícula y devuelve un JWT en cookie.
     * @route POST /login
     * @param {string} req.body.matricula - Matrícula del usuario
     * @returns {Object} JSON { success: true } o { error: mensaje }
     */
    app.post('/login', (req, res) => {
      const matricula = parseInt(req.body.matricula, 10);
      if (Number.isNaN(matricula)) {
        return res.status(400).json({ error: 'Matrícula inválida' });
      }
      const user = users.find(u => u.matricula === matricula);
      if (!user) {
        return res.status(401).json({ error: 'Matrícula no registrada' });
      }
      // Genera y firma el token con matrícula y rol
      const token = jwt.sign(
        { matricula: user.matricula, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      // Envía el token en una cookie HTTP only
      res.cookie('token', token, { httpOnly: true });
      res.json({ success: true });
    });

    /**
     * Ruta para obtener el perfil completo del usuario autenticado.
     * @route GET /profile
     * @middleware auth()
     * @returns {Object} JSON { usuario: { matricula, nombre, correo, rol } }
     */
    app.get('/profile', auth(), (req, res) => {
      const fullUser = users.find(u => u.matricula === req.user.matricula);
      if (!fullUser) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ usuario: fullUser });
    });

    // *** Gestión de eventos en memoria ***
    let events = [];
    let nextEventId = 1;

    /**
     * Crea un nuevo evento.
     * @route POST /events
     * @middleware auth(['Presidenta','Vicepresidente'])
     * @param {string} req.body.nombre - Nombre del evento
     * @param {string} [req.body.descripcion] - Descripción
     * @param {string[]} req.body.horarios - Array de strings horarios (ej: ['08:00','09:00'])
     * @param {string[]} req.body.roles - Roles del evento (ej: ['Host','Speaker'])
     * @returns {Object} JSON del evento creado
     */
    app.post('/events', auth(['Presidenta','Vicepresidente']), (req, res) => {
      const { nombre, descripcion, horarios, roles } = req.body;
      if (!nombre || !Array.isArray(horarios) || horarios.length === 0 || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }
      const newEvent = {
        id: nextEventId++,
        nombre,
        descripcion: descripcion || '',
        horarios,
        roles,
        inscripciones: [] // { matricula, rol, horario }
      };
      events.push(newEvent);
      res.status(201).json(newEvent);
    });

    /**
     * Lista todos los eventos.
     * @route GET /events
     * @middleware auth()
     * @returns {Object[]} Array de eventos
     */
    app.get('/events', auth(), (req, res) => {
      res.json(events);
    });

    /**
     * Inscribe al usuario en un turno de un evento.
     * @route POST /events/:id/register
     * @middleware auth()
     * @param {string} req.params.id - ID del evento
     * @param {string} req.body.horario - Horario elegido
     * @param {string} req.body.rol - Rol elegido
     * @returns {Object} JSON { success: true } o { error: mensaje }
     */
    app.post('/events/:id/register', auth(), (req, res) => {
      const eventId = parseInt(req.params.id, 10);
      const event = events.find(e => e.id === eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }
      const { horario, rol } = req.body;
      if (!event.horarios.includes(horario)) {
        return res.status(400).json({ error: 'Horario inválido' });
      }
      if (!event.roles.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido para este evento' });
      }
      const already = event.inscripciones.some(i =>
        i.matricula === req.user.matricula && i.horario === horario && i.rol === rol
      );
      if (already) {
        return res.status(400).json({ error: 'Ya estás inscrito en ese turno' });
      }
      // Agrega inscripción
      event.inscripciones.push({
        matricula: req.user.matricula,
        rol,
        horario
      });
      res.json({ success: true });
    });

    // Inicia el servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Error al iniciar la aplicación:', err);
    process.exit(1);
  }
}

main();