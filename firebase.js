import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Función para obtener el historial de un usuario desde Firebase
export async function obtenerHistorial(usuarioID) {
  try {
    const historialRef = collection(db, 'users', usuarioID, 'historial');
    const querySnapshot = await getDocs(historialRef);
    
    const historialData = [];
    querySnapshot.forEach((doc) => {
      historialData.push(doc.data());
    });

    return historialData;
  } catch (error) {
    console.error("Error al obtener el historial:", error);
  }
}
