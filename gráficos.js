import { db } from './firebaseConfig.js'; // Asegúrate de importar tu configuración de Firebase
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Función para obtener el ID del usuario basado en su nombre y apellido
function obtenerIDUsuarioPorNombreYApellido() {
  const auth = getAuth();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Obtener nombre y apellido desde el perfil de usuario o de otro lugar
      const nombre = user.displayName.split(" ")[0];  // Suponiendo que el nombre y apellido están juntos en displayName
      const apellidoPaterno = user.displayName.split(" ")[1]; // Asumiendo que el apellido está en el displayName

      // Hacer la consulta para obtener el ID del usuario con nombre y apellido
      const q = query(collection(db, "usuarios"), where("nombre", "==", nombre), where("apellidoPaterno", "==", apellidoPaterno));

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const usuarioDoc = querySnapshot.docs[0];  // Suponemos que hay un solo documento con este nombre y apellido
        const usuarioID = usuarioDoc.id; // El ID del documento de Firestore
        console.log("ID del usuario autenticado:", usuarioID);

        // Llamar a las funciones necesarias para obtener datos de Firestore y generar el gráfico
        obtenerDatosDeHistorial(usuarioID, generarGraficoDensidad);
      } else {
        console.log("No se encontró un usuario con ese nombre y apellido.");
      }
    } else {
      console.log("El usuario no está autenticado.");
    }
  });
}

// Llamar a la función cuando la página se carga o cuando el usuario inicia sesión
window.onload = () => {
  obtenerIDUsuarioPorNombreYApellido(); // Esto manejará la obtención del usuario y la carga del gráfico
};

// Función para obtener los datos del historial de Firestore
function obtenerDatosDeHistorial(usuarioID, callback) {
  try {
    const historialRef = collection(db, 'users', usuarioID, 'historial');

    // Escuchar los cambios en tiempo real
    const unsubscribe = onSnapshot(historialRef, (querySnapshot) => {
      const historialData = [];
      querySnapshot.forEach((doc) => {
        historialData.push(doc.data());
      });

      // Llamar al callback con los datos del historial
      callback(historialData);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error al recuperar los datos del historial:", error);
  }
}

// Función para generar el gráfico de densidad con Chart.js
function generarGraficoDensidad(historialData) {
  const movimientosCorrectos = [];
  const movimientosIncorrectos = [];

  // Extraer los movimientos correctos e incorrectos para cada ejercicio
  historialData.forEach((dato) => {
    movimientosCorrectos.push(dato.movimientosCorrectos);
    movimientosIncorrectos.push(dato.movimientosIncorrectos);
  });

  // Configuración del gráfico de densidad
  const ctx = document.getElementById('graficoDensidad').getContext('2d');
  const graficoDensidad = new Chart(ctx, {
    type: 'bar', // Tipo de gráfico (puedes cambiarlo por otro tipo)
    data: {
      labels: historialData.map((dato) => dato.nombreEjercicio), // Nombres de los ejercicios
      datasets: [{
        label: 'Movimientos Correctos',
        data: movimientosCorrectos,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Movimientos Incorrectos',
        data: movimientosIncorrectos,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          beginAtZero: true
        },
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
