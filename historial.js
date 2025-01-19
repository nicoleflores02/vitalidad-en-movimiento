import { db } from './firebaseConfig.js';
import { collection, query, getDocs, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Referencias HTML
const submenuUsuarios = document.getElementById("submenu-usuarios");  // Submenú de usuarios
const historialList = document.getElementById("historialList");       // Lista del historial
const detallesHistorial = document.getElementById("detallesHistorial"); // Contenedor para los detalles del historial

// Recuperar los usuarios del localStorage
const usuariosSeleccionados = JSON.parse(localStorage.getItem("usersData")) || [];

// Función para mostrar los usuarios en el submenú
function cargarUsuariosEnSubmenu() {
  submenuUsuarios.innerHTML = ""; // Limpiar el submenú antes de agregar opciones

  if (usuariosSeleccionados.length > 0) {
    usuariosSeleccionados.forEach((usuario) => {
      const li = document.createElement("li");
      li.textContent = `${usuario.nombre} ${usuario.apellidoPaterno}`;
      li.addEventListener("click", () => mostrarHistorial(usuario));  // Asignar función de mostrar historial
      submenuUsuarios.appendChild(li);
    });
  } else {
    submenuUsuarios.innerHTML = "<li>No hay usuarios seleccionados.</li>";
  }
}

// Función para mostrar el historial del usuario seleccionado
async function mostrarHistorial(usuario) {
  // Construir el nombre completo del usuario para acceder al documento correcto
  const nombreCompleto = `${usuario.nombre} ${usuario.apellidoPaterno}`;
  
  // Crear la referencia a la subcolección "historial" del usuario
  const historialRef = collection(db, `users/${nombreCompleto}/historial`);
  const q = query(historialRef, orderBy("fecha", "desc")); // Ordenar por fecha de forma descendente

  try {
    historialList.innerHTML = "<li>Cargando historiales...</li>";
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      historialList.innerHTML = "<li>No hay historial disponible para este usuario.</li>";
      return;
    }

    historialList.innerHTML = ""; // Limpiar la lista antes de agregar los elementos

    snapshot.forEach((doc) => {
      const historialData = doc.data();

      // Verifica si el historial contiene solo la fecha para mostrarla en la lista
      if (historialData.fecha) {
        mostrarHistorialFecha(historialData, doc.id, nombreCompleto); // Mostrar solo la fecha en la lista
      }
    });
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    historialList.innerHTML = `<li>Error al cargar el historial: ${error.message}</li>`;
  }
}
// Función para formatear tiempo en horas, minutos y segundos
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Función para mostrar los detalles del historial
async function mostrarDetallesHistorial(docId, nombreCompleto) {
  try {
    // Obtener el documento usando docId
    const docRef = doc(db, `users/${nombreCompleto}/historial`, docId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const detalleData = docSnapshot.data();
      const formattedDuration = detalleData.duracion
        ? formatTime(detalleData.duracion)
        : "Duración no especificada";
      // Mostrar los detalles en el contenedor de detalles
      detallesHistorial.innerHTML = `
        <h3>Detalles del Historial</h3>
        <p><strong>Nombre del ejercicio:</strong> ${detalleData.nombreEjercicio || "No especificado"}</p>
        <p><strong>Fecha:</strong> ${detalleData.fecha.toDate().toLocaleString()}</p>
         <p><strong>Duración:</strong> ${formattedDuration}</p>
        <p><strong>Movimientos correctos:</strong> ${detalleData.movimientosCorrectos ?? "No especificado"}</p>
        <p><strong>Movimientos incorrectos:</strong> ${detalleData.movimientosIncorrectos ?? "No especificado"}</p>
        <p><strong>Precisión:</strong> ${detalleData.precision ? `${detalleData.precision}%` : "No especificada"}</p>
      `;
      
      // Si quieres hacer que el contenedor de detalles se enfoque
      detallesHistorial.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } else {
      console.log("No se encontró el documento.");
      detallesHistorial.innerHTML = "<p>No se encontraron detalles para este historial.</p>";
    }
  } catch (error) {
    console.error("Error al obtener los detalles:", error);
    detallesHistorial.innerHTML = `<p>Error al cargar los detalles: ${error.message}</p>`;
  }
}

// Función para mostrar solo la fecha en la lista
function mostrarHistorialFecha(historialData, docId, nombreCompleto) {
  let fechaFormateada;
  if (historialData.fecha && historialData.fecha.toDate) {
    fechaFormateada = historialData.fecha.toDate().toLocaleString();
  } else if (typeof historialData.fecha === "string") {
    fechaFormateada = new Date(historialData.fecha).toLocaleString();
  } else {
    fechaFormateada = "Fecha no disponible";
  }

  const formattedDuration = historialData.duracion
    ? formatTime(historialData.duracion)
    : "Duración no especificada";

  // Crear un elemento de lista para la fecha
  const listItem = document.createElement("li");
  listItem.innerHTML = `
    <p><strong>Fecha:</strong> ${fechaFormateada}</p>
    <p><strong>Duración:</strong> ${formattedDuration}</p>
  `;
  listItem.style.cursor = "pointer";

  // Asignar evento para mostrar los detalles al hacer clic
  listItem.addEventListener("click", () => {
    mostrarDetallesHistorial(docId, nombreCompleto); // Pasar nombreCompleto a la función
  });

  historialList.appendChild(listItem);
}


// Cargar los usuarios seleccionados en el submenú
cargarUsuariosEnSubmenu();
