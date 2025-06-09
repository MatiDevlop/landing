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

// Carga usuarios y arranca el servidor
async function main() {
  try {
    users = await loadUsers();
    console.log(`Usuarios cargados: ${users.length}`);
    console.log('Primeras matrículas:', users.slice(0,10).map(u => u.matricula));

    // Ruta de login: solo matrícula
    app.post('/login', (req, res) => {
        const matricula = parseInt(req.body.matricula, 10);
        if (Number.isNaN(matricula)) {
        return res.status(400).json({ error: "Matrícula inválida" });
        }
        const user = users.find(u => u.matricula === matricula);

      if (!user) {
        return res.status(401).json({ error: 'Matrícula no registrada' });
      }
      // Genera token con matrícula y rol
      const token = jwt.sign(
        { matricula: user.matricula, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      // Lo envía como cookie HTTP only
      res.cookie('token', token, { httpOnly: true });
      res.json({ success: true });
    });

    // Middleware de autenticación y autorización
    function auth(requiredRoles = []) {
      return (req, res, next) => {
        const token = req.cookies.token;
        if (!token) return res.status(401).end();
        try {
          const payload = jwt.verify(token, JWT_SECRET);
          if (requiredRoles.length && !requiredRoles.includes(payload.rol)) {
            return res.status(403).end();
          }
          req.user = payload;
          next();
        } catch {
          res.status(401).end();
        }
      };
    }

    // Ruta de ejemplo protegida: devuelve todos los campos del usuario
    app.get('/profile', auth(), (req, res) => {
    // Busca en el array “users” el registro completo
    const fullUser = users.find(u => u.matricula === req.user.matricula);
    if (!fullUser) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario: fullUser });
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