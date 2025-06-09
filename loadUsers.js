// loadUsers.js
import ExcelJS from 'exceljs';

export default async function loadUsers() {
  // Leer el workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('members.xlsx');

  // Obtener la hoja por nombre (ajustar según tu archivo)
  const sheet = workbook.getWorksheet('Miembros');
  if (!sheet) throw new Error("La hoja 'Miembros' no existe en members.xlsx");

  // Leer encabezados (fila 1)
  const headerRow = sheet.getRow(1);
  // headerRow.values incluye un índice vacío al inicio, así que descartamos posición 0
  const headers = headerRow.values.slice(1);

  const users = [];

  // Iterar cada fila (a partir de la 2)
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // saltar encabezado

    // Valores de la fila (descartar posición 0)
    const rowValues = row.values.slice(1);

    // Construir objeto genérico con todos los campos
    const raw = {};
    headers.forEach((key, i) => {
      raw[key] = rowValues[i];
    });

    // Mapear a la estructura de usuario deseada
    users.push({
      matricula: Number(raw['matricula'] || raw['Matrícula']),
      nombre: `${raw['Nombres']}${raw['Apellidos']}`.trim(),
      correo: raw['Correo ESPOL'],
      rol: raw['Cargo dentro del club'] || 'Miembro',
      // Agrega aquí más campos si es necesario:
      // carrera: raw['Carrera'],
      // telefono: raw['Teléfono'],
    });
  });

  return users;
}