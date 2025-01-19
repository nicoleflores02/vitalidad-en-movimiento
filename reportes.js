import { db } from './firebaseConfig.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Configuración de Firebase Authentication
const auth = getAuth();

// Función para obtener el progreso del usuario
function obtenerProgreso(usuarioID) {
  const progresoRef = collection(db, 'users', usuarioID, 'progreso');
  const q = query(progresoRef);

  getDocs(q).then((querySnapshot) => {
    const contenedorProgreso = document.getElementById('progreso');
    contenedorProgreso.innerHTML = ''; // Limpiar contenido previo

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const div = document.createElement('div');
      div.classList.add('progreso-item');
      div.innerHTML = `
        <p><strong>Semana:</strong> ${data.semana}</p>
        <p><strong>Ejercicio Realizado:</strong> ${data.ejercicio}</p>
        <p><strong>Movimientos Correctos:</strong> ${data.movimientosCorrectos}</p>
        <p><strong>Movimientos Incorrectos:</strong> ${data.movimientosIncorrectos}</p>
        <p><strong>Precisión:</strong> ${data.precision}%</p>
        <p><strong>Fecha:</strong> ${new Date(data.fecha.seconds * 1000).toLocaleString()}</p>
      `;
      contenedorProgreso.appendChild(div);
    });
  }).catch((error) => {
    console.error("Error al obtener el progreso del usuario:", error);
  });
}

// Función para obtener el ID del usuario basado en nombre y apellido desde Firestore
function obtenerUsuarioID(nombre, apellidoPaterno) {
  return `${nombre}_${apellidoPaterno}`;
}

// Función para obtener el nombre y apellido desde Firestore y obtener el progreso
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Obtener el nombre y apellido del usuario desde Firestore usando el UID del usuario
    const usuarioRef = collection(db, 'users');
    const q = query(usuarioRef, where('email', '==', user.email)); // Suponemos que el email se usa como identificador único

    getDocs(q).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const usuarioData = doc.data();
        const nombre = usuarioData.nombre;
        const apellidoPaterno = usuarioData.apellidoPaterno;
        
        // Construir el usuarioID basado en el nombre y apellido
        const usuarioID = obtenerUsuarioID(nombre, apellidoPaterno);
        
        // Obtener y mostrar el progreso
        obtenerProgreso(usuarioID);
      });
    }).catch((error) => {
      console.error("Error al obtener los datos del usuario desde Firestore:", error);
    });
  } else {
    console.log("No hay un usuario autenticado.");
  }
});
