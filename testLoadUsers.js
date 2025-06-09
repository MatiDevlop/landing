// testLoadUsers.js
import loadUsers from './loadUsers.js';

(async () => {
  try {
    const users = await loadUsers();
    console.log('Usuarios cargados:', users.length);
    console.log(users.slice(0, 5));  // muestra sólo los 5 primeros para no saturar
  } catch (err) {
    console.error('Error cargando usuarios:', err);
  }
})();
