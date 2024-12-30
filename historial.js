import { db } from './firebaseConfig.js';  // Asegúrate de importar 'db' correctamente desde firebaseConfig.js
import { collection, addDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";



// Función para cargar el historial de un usuario en una sesión
async function cargarHistorial(sessionID, usuarioId) {
  try {
    // Corregir la referencia de la colección con la ruta adecuada
    const historialRef = collection(db, "sessions", sessionID, "usuarios", usuarioId, "historial");
    
    const querySnapshot = await getDocs(historialRef);
    const historialContainer = document.getElementById(`historialContainer-${usuarioId}`);
    
    if (historialContainer) {  // Comprobamos que el contenedor exista
      historialContainer.innerHTML = "";  // Limpiar contenido previo

      querySnapshot.forEach((doc) => {
        const sessionData = doc.data();
        const listItem = document.createElement("li");
        listItem.textContent = `Fecha: ${sessionData.fecha.toDate()} - Ejercicio: ${sessionData.nombreEjercicio} - Movimientos Correctos: ${sessionData.movimientosCorrectos} - Movimientos Incorrectos: ${sessionData.movimientosIncorrectos} - Precisión: ${sessionData.precision}%`;
        historialContainer.appendChild(listItem);
      });
    } else {
      console.error("El contenedor de historial no se encontró en el DOM");
    }
  } catch (error) {
    console.error("Error al cargar el historial:", error);
  }
}

// Función para escuchar cambios en el historial en tiempo real
function escucharHistorial(sessionID, usuarioId) {
  const historialRef = collection(db, "sessions", sessionID, "usuarios", usuarioId, "historial");

  onSnapshot(historialRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const sessionData = change.doc.data();
      if (change.type === "added") {
        const historialContainer = document.getElementById(`historialContainer-${usuarioId}`);
        if (historialContainer) {  // Verificamos que el contenedor exista antes de modificarlo
          const listItem = document.createElement("li");
          listItem.textContent = `Fecha: ${sessionData.fecha.toDate()} - Ejercicio: ${sessionData.nombreEjercicio} - Movimientos Correctos: ${sessionData.movimientosCorrectos} - Movimientos Incorrectos: ${sessionData.movimientosIncorrectos} - Precisión: ${sessionData.precision}%`;
          historialContainer.appendChild(listItem);
        }
      }
    });
  });
}

// Cargar el historial cuando la página se haya cargado y el usuario esté autenticado
document.addEventListener('DOMContentLoaded', () => {
  const auth = getAuth(); // Inicializar auth en este archivo
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const sessionID = "sessionID_compartida"; // ID de la sesión compartida
      // Cargar el historial para los tres usuarios
      for (let i = 1; i <= 3; i++) {
        cargarHistorial(sessionID, user.uid); // Este usuario es el que inició sesión
        escucharHistorial(sessionID, user.uid);  // Escuchar cambios en el historial para este usuario
      }
    } else {
      console.log("Usuario no autenticado");
    }
  });
});
