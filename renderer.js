// renderer.js
import { db  } from './firebaseConfig.js';
import {  collection, addDoc, onSnapshot   } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";  // Importar las funciones necesarias

// Función para descargar el PDF
const { jsPDF } = window.jspdf;
const doc = new jsPDF();

document.getElementById('download1').addEventListener('click', function () {
  const doc = new jsPDF();

  const personName = document.getElementById('personName1').textContent;
  const date = document.getElementById('date1').textContent;
  const time = document.getElementById('time1').textContent;
  const correctCount = document.getElementById('correctCount1').textContent;
  const incorrectCount = document.getElementById('incorrectCount1').textContent;
  const accuracy = document.getElementById('accuracy1').textContent;

  // Agregar información al PDF
  doc.text(`Informe de Ejercicio - ${personName}`, 10, 10);
  doc.text(date, 10, 20);
  doc.text(time, 10, 30);
  doc.text(correctCount, 10, 40);
  doc.text(incorrectCount, 10, 50);
  doc.text(accuracy, 10, 60);

  // Descargar el archivo PDF
  doc.save(`${personName}_informe.pdf`);
});

function generatePDF(personIndex) {
  // Usar la librería jsPDF correctamente con el nuevo nombre
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const personName = document.getElementById(`name${personIndex}`).textContent; 
  const date = document.getElementById(`date${personIndex}`).textContent;
  const time = document.getElementById(`time${personIndex}`).textContent;
  const correctCount = document.getElementById(`correctCount${personIndex}`).textContent;
  const incorrectCount = document.getElementById(`incorrectCount${personIndex}`).textContent;
  const accuracy = document.getElementById(`accuracy${personIndex}`).textContent;

  // Agregar información al PDF
  doc.text(`Informe de Ejercicio - ${personName}`, 10, 10);
  doc.text(date, 10, 20);
  doc.text(time, 10, 30);
  doc.text(correctCount, 10, 40);
  doc.text(incorrectCount, 10, 50);
  doc.text(accuracy, 10, 60);

  // Descargar el archivo PDF
  doc.save(`${personName}_informe.pdf`);
}

// Asignar evento de clic a cada botón de descarga
document.querySelectorAll('.downloadButton').forEach((button, index) => {
  button.addEventListener('click', () => generatePDF(index + 1));
});


// Obtener referencias a los elementos del DOM
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const exerciseGif = document.getElementById('exerciseGif');
const buttons = document.querySelectorAll('.buttons button');
const exerciseTitle = document.getElementById('exerciseTitle');

const correctCountElems = [
  document.getElementById('correctCount1'),
  document.getElementById('correctCount2'),
  document.getElementById('correctCount3')
];
const incorrectCountElems = [
  document.getElementById('incorrectCount1'),
  document.getElementById('incorrectCount2'),
  document.getElementById('incorrectCount3')
];
const timeElems = [
  document.getElementById('time1'),
  document.getElementById('time2'),
  document.getElementById('time3')
];
const accuracyElems = [
  document.getElementById('accuracy1'),
  document.getElementById('accuracy2'),
  document.getElementById('accuracy3')
];

const dateElems = [
  document.getElementById('date1'),
  document.getElementById('date2'),
  document.getElementById('date3')
]; 



// Inicialización de las variables

let selectedButton = null;

let isExerciseFinished = false; // Variable para controlar si el ejercicio se ha finalizado



// Variables para Pose Detection
let detector;
let detectorConfig = {
  modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING // Cambiamos a 'MULTIPOSE'
};

// Cargar el modelo de detección de poses
async function loadPoseModel() {
  try {
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    console.log("Modelo de detección de poses cargado.");
    detectMovementAndPose();
  } catch (error) {
    console.error("Error al cargar el modelo de detección de poses:", error);
  }
}

// Acceder a la cámara
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  } catch (err) {
    console.error("Error al acceder a la cámara: ", err);
    alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
  }
}

// Inicialización de las variables
let lastDetectedCorrect = [false, false, false];  // Estado de cada persona, true si el último movimiento fue correcto
let lastDetectedIncorrect = [false, false, false]; // Estado de cada persona, true si el último movimiento fue incorrecto

let correctCount = [0, 0, 0];
let incorrectCount = [0, 0, 0];
let totalTime = [0, 0, 0];
let startTime = [null, null, null];

let alertInterval = null; // Para controlar el intervalo de la alerta
let alertPlayed = false; // Para asegurarnos de que la alerta suene solo una vez cuando se selecciona un ejercicio

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


// Función para reproducir alertas de audio
function playAlertSound() {
  if (alertInterval || isExerciseFinished) return; // Evitar que se reproduzca la alerta si ya está sonando

  const audio = new Audio('assets/audio/alert-sound1.mp3'); // Ruta del archivo de audio
  audio.play();

  // Pausar la alerta para que no suene repetidamente
  alertInterval = setInterval(() => {
    audio.play();
  }, 2000); // Intervalo de 2 segundos entre alertas (ajustable)

  // Detener la alerta después de cierto tiempo
  setTimeout(() => {
    clearInterval(alertInterval); // Detener el intervalo
    alertInterval = null; // Liberar el intervalo
    alertPlayed = false; // Permitir que la alerta suene nuevamente cuando se seleccione otro ejercicio
  }, 10000); // Detener la alerta después de 10 segundos (ajustable)
} 

function checkStandingPosture(keypoints) {
  // Buscar las posiciones de las caderas y rodillas
  const leftHip = keypoints.find(k => k.name === 'left_hip');
  const rightHip = keypoints.find(k => k.name === 'right_hip');
  const leftKnee = keypoints.find(k => k.name === 'left_knee');
  const rightKnee = keypoints.find(k => k.name === 'right_knee');

  if (leftHip && rightHip && leftKnee && rightKnee) {
    // Verificar si las caderas están alineadas (pequeña diferencia entre alturas)
    const deltaY = Math.abs(leftHip.y - rightHip.y);
    const threshold = 15; // Umbral ajustado para mayor precisión

    // Verificar si las caderas están por encima de las rodillas
    const isHipsAboveKnees = leftHip.y < leftKnee.y && rightHip.y < rightKnee.y;

    // Si las caderas están alineadas y por encima de las rodillas, la persona está de pie
    if (deltaY < threshold && isHipsAboveKnees) {
      return true;
    }
  }

  return false; // La persona no está de pie
}

// Función principal para detectar movimiento y poses de múltiples personas
async function detectMovementAndPose() {
  if (video.paused || video.ended) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Asignar fecha y hora generales (solo una vez por frame)
  const currentDate = new Date();
  const formattedDate = `Fecha y Hora: ${currentDate.toLocaleString()}`;
  dateElems.forEach(dateElem => dateElem.textContent = formattedDate);

  // Detectar poses de múltiples personas
  const poses = await detector.estimatePoses(video);

  poses.slice(0, 3).forEach((pose, index) => { // Limitamos a las primeras tres personas detectadas
    drawKeypoints(pose.keypoints, index);
    drawSkeleton(pose.keypoints);

    const isStanding = checkStandingPosture(pose.keypoints);
    

   // Nueva condición: Suena solo si hay un botón seleccionado y la postura es incorrecta
   if (selectedButton && !isExerciseFinished && !isStanding) {
    if (!alertPlayed) {
      playAlertSound(); // Reproducir alerta si no está sonando
      alertPlayed = true; // Evitar que la alerta se reproduzca repetidamente
    }
  } else {
    // Si la postura es correcta o no hay ejercicio seleccionado, detener la alerta
    if (alertInterval) {
      clearInterval(alertInterval); // Detener cualquier intervalo activo
      alertInterval = null; // Liberar el intervalo
    }
    alertPlayed = false; // Permitir reproducir la alerta nuevamente si cambian las condiciones
  }


    // Verificar ejercicio para cada persona
    if (selectedButton) {
      if (!startTime[index] && !isExerciseFinished) {
        startTime[index] = performance.now(); // Comienza el tiempo si no está iniciado
      }

      const gifName = selectedButton.getAttribute('data-gif');
      const isCorrect = recognizeExercise(pose.keypoints, gifName);

      // Si el movimiento es correcto y no se había detectado anteriormente como correcto
      if (isCorrect ) {
        if (!lastDetectedCorrect[index]) {
          correctCount[index]++;  // Incrementar el contador de correctos
          lastDetectedCorrect[index] = true;  // Marcar que el movimiento fue correcto
          lastDetectedIncorrect[index] = false;  // Marcar que no es incorrecto
          
          // Actualizar el contador de correctos en el HTML
          const personContainer = document.getElementById(`person${index + 1}`);
          if (personContainer) {
            const correctCountElem = personContainer.querySelector(`#correctCount${index + 1}`);
            if (correctCountElem) {
              correctCountElem.textContent = `${users[index]} - Correctos: ${correctCount[index]}`;
            }
          }
        }
      } else if (!isCorrect) {
        if (!lastDetectedIncorrect[index]) {
          incorrectCount[index]++;  // Incrementar el contador de incorrectos
          lastDetectedIncorrect[index] = true;  // Marcar que el movimiento fue incorrecto
          lastDetectedCorrect[index] = false;  // Marcar que no es correcto
          
          // Actualizar el contador de incorrectos en el HTML
          const personContainer = document.getElementById(`person${index + 1}`);
          if (personContainer) {
            const incorrectCountElem = personContainer.querySelector(`#incorrectCount${index + 1}`);
            if (incorrectCountElem) {
              incorrectCountElem.textContent = `${users[index]} - Incorrectos: ${incorrectCount[index]}`;
            }
          }
        }
      }

      if (startTime[index] && !isExerciseFinished) {
        totalTime[index] = (performance.now() - startTime[index]) / 1000; // Calcula el tiempo en segundos
        
        // Usa la nueva función para formatear el tiempo
        const formattedTime = formatTime(totalTime[index]);
    
        // Actualiza el tiempo en el contenedor de la persona
        const personContainer = document.getElementById(`person${index + 1}`);
        if (personContainer) {
            const timeElem = personContainer.querySelector(`#time${index + 1}`);
            if (timeElem) {
                timeElem.textContent = `Tiempo por Ejercicio: ${formattedTime}`;
            }
        }
    }
    }

    

    // Calcular precisión y actualizar en el contenedor correspondiente
    const totalMovements = correctCount[index] + incorrectCount[index];
    const accuracy = totalMovements > 0 ? (correctCount[index] / totalMovements) * 100 : 0;
    
    const personContainer = document.getElementById(`person${index + 1}`);
    if (personContainer) {
      const accuracyElem = personContainer.querySelector(`#accuracy${index + 1}`);
      if (accuracyElem) {
        accuracyElem.textContent = `Precisión: ${accuracy.toFixed(2)}%`;
      }
    }
  });

  requestAnimationFrame(detectMovementAndPose);
}


// Obtener referencia al botón "Finalizar Ejercicio"
const finishButton = document.getElementById('finishButton');

// Evento para congelar el tiempo cuando se presiona el botón
finishButton.addEventListener('click', () => {
  isExerciseFinished = true; // Congelar el tiempo
  alert("Ejercicio Finalizado. El tiempo se ha congelado.");

  // Detener la alerta si está activa
  if (alertInterval) {
    clearInterval(alertInterval); // Detener el intervalo
    alertInterval = null; // Liberar el intervalo
  }
  alertPlayed = false; // Permitir que la alerta vuelva a sonar solo al seleccionar un nuevo ejercicio

  finalizarEjercicioParaUsuarios();
});

let users = [];  // Array donde se almacenarán los nombres de los usuarios

// Función para guardar los datos de cada ejercicio en el historial de cada usuario
export async function guardarEnHistorial(usuarioID, ejercicioData) {
  try {
    // Referencia a la colección 'historial' del usuario con su UID único
    const historialRef = collection(db, 'users', usuarioID, 'historial');
    
    // Guardar el ejercicio en el historial usando addDoc
    await addDoc(historialRef, {
      nombreEjercicio: ejercicioData.nombre,
      duracion: ejercicioData.duracion,
      movimientosCorrectos: ejercicioData.movimientosCorrectos,
      movimientosIncorrectos: ejercicioData.movimientosIncorrectos,
      precision: ejercicioData.precision,
      fecha: new Date()  // Fecha de realización
    });
    
    console.log("Ejercicio guardado en el historial para el usuario:", usuarioID);
  } catch (error) {
    console.error("Error al guardar el ejercicio para el usuario:", usuarioID, error);
  }
}

// Llamar a esta función cuando se termine el ejercicio para un usuario

function finalizarEjercicioParaUsuarios() {
  for (let index = 0; index < 3; index++) {
    // Obtener el nombre del ejercicio basado en el gifName seleccionado
    const ejercicioNombre = getExerciseName(selectedButton.getAttribute('data-gif'));

    const ejercicioData = {
      nombre: ejercicioNombre,  // Nombre del ejercicio basado en el gif
      duracion: totalTime[index],
      movimientosCorrectos: correctCount[index],
      movimientosIncorrectos: incorrectCount[index],
      precision: (correctCount[index] + incorrectCount[index] > 0)
        ? (correctCount[index] / (correctCount[index] + incorrectCount[index])) * 100
        : 0
    };

    const usuarioID = users[index]; // Suponiendo que 'users' contiene los UID de cada usuario

    // Verificar que el usuario esté autenticado antes de guardar en Firestore
    if (usuarioID) {
      // Llamamos a la función para guardar los datos en el historial de Firestore
      guardarEnHistorial(usuarioID, ejercicioData);
    } else {
      console.log("No hay un usuario autenticado.");
    }
  }
}

// Función para obtener datos del historial en tiempo real
export function obtenerHistorialEnTiempoReal(usuarioID, callback) {
  try {
    // Referencia a la colección 'historial' del usuario
    const historialRef = collection(db, 'users', usuarioID, 'historial');
    
    // Escuchar cambios en tiempo real en los documentos de historial
    const unsubscribe = onSnapshot(historialRef, (querySnapshot) => {
      const historialData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Asegúrate de que los datos que esperas estén presentes
        const nombreEjercicio = data.nombreEjercicio || "No especificado";
        const fecha = data.fecha ? data.fecha.toDate().toLocaleString() : "Fecha no disponible";
        const duracionEnSegundos = data.duracion || 0;
        const duracionFormateada = formatTime(duracionEnSegundos);
        const movimientosCorrectos = data.movimientosCorrectos || 0;
        const movimientosIncorrectos = data.movimientosIncorrectos || 0;
        const precision = data.precision || 0;

        historialData.push({
          id: doc.id,  // Guarda el ID del documento para usarlo al hacer clic
          nombreEjercicio,
          fecha,
          duracion: duracionFormateada,
          movimientosCorrectos,
          movimientosIncorrectos,
          precision
        });
      });
      
      // Llamar al callback con los datos actualizados
      callback(historialData);
    });
    
    // Devolver la función unsubscribe para que puedas dejar de escuchar los cambios cuando lo necesites
    return unsubscribe;
  } catch (error) {
    console.error("Error al recuperar el historial del usuario:", usuarioID, error);
  }
}


// Función para obtener los usuarios desde la base de datos (o localStorage)
function getUsersFromDatabase() {
  const usersData = JSON.parse(localStorage.getItem("usersData"));
  
  if (usersData && usersData.length === 3) {
    // Actualizamos el arreglo `users` con los nombres completos de cada usuario
    users = usersData.map(user => `${user.nombre} ${user.apellidoPaterno}`);

    // Si deseas, puedes también actualizar la interfaz con estos datos:
    usersData.forEach((user, index) => {
      const personContainer = document.getElementById(`person${index + 1}`);
      personContainer.querySelector("h3").textContent = `${user.nombre} ${user.apellidoPaterno}`;
    });
  } else {
    // En caso de que no haya datos o no sean 3 usuarios, asignamos nombres predeterminados
    users = ["Usuario 1", "Usuario 2", "Usuario 3"];
  }
}

// Función para dibujar keypoints y nombres para múltiples personas con colores distintos
function drawKeypoints(keypoints, index) {
  const colors = ['#00FF00', '#0000FF', '#FF00FF']; // Colores distintos para cada persona

  // Dibuja los puntos clave (keypoints)
  keypoints.forEach(keypoint => {
    if (keypoint.score > 0.5) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI); // Dibuja el círculo en el punto clave
      ctx.fillStyle = colors[index]; // Asigna el color según el índice
      ctx.fill();
    }
  });

  // Dibuja el nombre de la persona en el mismo color
  ctx.fillStyle = colors[index]; // Asigna el color para el texto (el mismo que el de los keypoints)
  ctx.font = '16px Arial'; // Establece el tamaño y tipo de fuente
  
  // Dibuja el nombre cerca del primer keypoint
  ctx.fillText(users[index], keypoints[0].x + 10, keypoints[0].y);
}

// Llamar a esta función después de que se hayan recuperado los usuarios de la base de datos
getUsersFromDatabase();


// Función para dibujar el esqueleto en el canvas
function drawSkeleton(keypoints) {
  const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
  
  adjacentPairs.forEach(pair => {
    const partA = keypoints[pair[0]];
    const partB = keypoints[pair[1]];
    
    if (partA.score > 0.5 && partB.score > 0.5) {
      ctx.beginPath();
      ctx.moveTo(partA.x, partA.y);
      ctx.lineTo(partB.x, partB.y);
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// Manejo de botones para selección de ejercicios
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const gifName = button.getAttribute('data-gif');
    loadExerciseGif(button, gifName);
    
    // Resaltar el botón seleccionado
    if (selectedButton) selectedButton.classList.remove('active');
    button.classList.add('active');
    selectedButton = button;

    // Reiniciar variables de la alarma y el estado del ejercicio
    alertPlayed = false; // Permitir que la alarma vuelva a sonar
    isExerciseFinished = false; // Marcar el ejercicio como no finalizado

    // Actualizar contadores de ejercicios en la interfaz
    correctCount = [0, 0, 0];
    incorrectCount = [0, 0, 0];
    
    startTime = [null, null, null];
    correctCountElems.forEach((elem, i) => elem.textContent = `Persona ${i + 1} - Correctos: 0`);
    incorrectCountElems.forEach((elem, i) => elem.textContent = `Persona ${i + 1} - Incorrectos: 0`);
    timeElems.forEach((elem, i) => elem.textContent = `Tiempo por Ejercicio: 0.00 s`);
    accuracyElems.forEach((elem, i) => elem.textContent = `Precisión: 0.00%`);

     // Reproducir la alarma solo cuando se selecciona un ejercicio (si aún no ha sonado)
     if (!alertPlayed) {
      playAlertSound(); // Llama a la función que reproduce la alerta
      alertPlayed = true; // Marcar que la alerta ha sonado
    }
    
  });
});

// Función para cargar el GIF del ejercicio seleccionado
function loadExerciseGif(button, gifName) {
  const gifPath = `assets/gifs/${gifName}.gif`;
  
  // Actualiza la fuente de la imagen
  exerciseGif.src = gifPath;
  
  // Actualiza el título del ejercicio
  exerciseTitle.textContent = getExerciseName(gifName);
  

}

// Función para obtener el nombre del ejercicio desde el gifName
function getExerciseName(gifName) {
  switch(gifName) {
    case 'Circulosconlosbrazos':
      return 'Círculos con los Brazos';
    case 'Elevacionesdebrazosfrontales':
      return 'Elevaciones de Brazos Frontales';
    case 'Elevacionesdebrazoslaterales':
      return 'Elevaciones de Brazos Laterales';
    case 'Encogimientodehombros':
      return 'Encogimiento de Hombros';
    case 'Estiramientodelcuello':
      return 'Estiramiento del Cuello';
    case 'Flexionlateraldeltronco':
      return 'Flexión Lateral del Tronco';
    // Añade más casos si agregas más ejercicios
    default:
      return 'Selecciona un ejercicio';
  }
}

// Función para reconocer el ejercicio basado en los keypoints
function recognizeExercise(keypoints, gifName) {
  switch(gifName) {
    case 'Circulosconlosbrazos':
      return detectCirculosconlosbrazos(keypoints);
    case 'Elevacionesdebrazosfrontales':
      return detectElevacionesdebrazosfrontales(keypoints);
    case 'Elevacionesdebrazoslaterales':
      return detectElevacionesdebrazoslaterales(keypoints);
    case 'Encogimientodehombros':
      return detectEncogimientodehombros(keypoints);
    case 'Estiramientodelcuello':
      return detectEstiramientodelcuello(keypoints);
    case 'Flexionlateraldeltronco':
      return detectFlexionlateraldeltronco(keypoints);
    default:
      return null;
  }
}


// Variables para almacenar el estado anterior de los ejercicios
// Declaración global de `exerciseState` que contiene el estado de cada ejercicio detectado
let exerciseState = {
  Estiramientodelcuello: false, // Estado del ejercicio de estiramiento del cuello
  Flexionlateraldeltronco: false, // Estado del ejercicio de flexión lateral del tronco
  Circulosconlosbrazos: false, // Estado del ejercicio de círculos con los brazos
  Elevacionesdebrazosfrontales: false, // Estado del ejercicio de elevaciones de brazos frontales
  Elevacionesdebrazoslaterales: false // Estado del ejercicio de elevaciones de brazos laterales
};



// Función para detectar "Círculos con los Brazos"
let circlesCounter = 0;
let lastDirectionX = null;
let lastDirectionY = null;

function detectCirculosconlosbrazos(keypoints, userParams = {circleThreshold: 4}) {
  // Buscar las posiciones de las muñecas (puntos clave)
  const leftWrist = keypoints.find(k => k.name === 'left_wrist');
  const rightWrist = keypoints.find(k => k.name === 'right_wrist');

  // Comprobamos si las posiciones de las muñecas tienen una alta precisión
  if (leftWrist.score > 0.5 && rightWrist.score > 0.5) {
    // Calculamos las posiciones promedio de ambas muñecas
    const avgWristX = (leftWrist.x + rightWrist.x) / 2;
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;

    // Calculamos la dirección de movimiento en el eje X y Y
    const directionX = avgWristX > lastDirectionX ? 'right' : 'left';
    const directionY = avgWristY > lastDirectionY ? 'up' : 'down';

    // Verificamos si ha habido un cambio de dirección en ambos ejes (indicando un cuarto de círculo)
    if (lastDirectionX && lastDirectionY) {
      if ((lastDirectionX !== directionX && lastDirectionY !== directionY) || 
          (lastDirectionX === directionX && lastDirectionY !== directionY)) {
        circlesCounter++; // Aumentamos el contador de círculos

        // Umbral para completar un círculo (ajustable)
        const circleThreshold = userParams.circleThreshold || 4;

        if (circlesCounter >= circleThreshold) {
          circlesCounter = 0; // Reseteamos el contador después de completar un círculo
          return true; // Círculo completo detectado
        }
      }
    }
    // Guardamos la última posición para detectar cambios de dirección
    lastDirectionX = avgWristX;
    lastDirectionY = avgWristY;
  }
  return false; // Si no se detecta un círculo completo
}


// Función para detectar "Elevaciones de Brazos Frontales"
let frontRaisesCounter = 0;
let lastDirectionXFront = null;
let lastDirectionYFront = null;

function detectElevacionesdebrazosfrontales(keypoints, userParams = {frontRaiseThreshold: 30}) {
  // Buscar las posiciones de las muñecas (puntos clave)
  const leftWrist = keypoints.find(k => k.name === 'left_wrist');
  const rightWrist = keypoints.find(k => k.name === 'right_wrist');

  // Comprobamos si las posiciones de las muñecas tienen una alta precisión
  if (leftWrist.score > 0.5 && rightWrist.score > 0.5) {
    // Calculamos las posiciones promedio de ambas muñecas
    const avgWristX = (leftWrist.x + rightWrist.x) / 2;
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;

    // Calculamos la dirección de movimiento en el eje X y Y
    const directionX = avgWristX > lastDirectionXFront ? 'right' : 'left';
    const directionY = avgWristY > lastDirectionYFront ? 'up' : 'down';

    // Verificamos si ha habido un cambio de dirección (indicando que el brazo se elevó)
    if (lastDirectionXFront && lastDirectionYFront) {
      if ((lastDirectionXFront !== directionX && lastDirectionYFront !== directionY) || 
          (lastDirectionXFront === directionX && lastDirectionYFront !== directionY)) {
        frontRaisesCounter++; // Aumentamos el contador de elevaciones

        // Umbral para completar una elevación (ajustable)
        const frontRaiseThreshold = userParams.frontRaiseThreshold || 30;

        if (frontRaisesCounter >= frontRaiseThreshold) {
          frontRaisesCounter = 0; // Reseteamos el contador después de completar una elevación
          return true; // Elevación completa detectada
        }
      }
    }

    // Guardamos la última posición para detectar cambios de dirección
    lastDirectionXFront = avgWristX;
    lastDirectionYFront = avgWristY;
  }
  return false; // Si no se detecta una elevación completa
}
// Función para detectar "Elevaciones de Brazos Laterales"
let sideRaisesCounter = 0;
let lastDirectionXSide = null;
let lastDirectionYSide = null;

function detectElevacionesdebrazoslaterales(keypoints, userParams = {sideRaiseThreshold: 30}) {
  // Buscar las posiciones de las muñecas (puntos clave)
  const leftWrist = keypoints.find(k => k.name === 'left_wrist');
  const rightWrist = keypoints.find(k => k.name === 'right_wrist');

  // Comprobamos si las posiciones de las muñecas tienen una alta precisión
  if (leftWrist.score > 0.5 && rightWrist.score > 0.5) {
    // Calculamos las posiciones promedio de ambas muñecas
    const avgWristX = (leftWrist.x + rightWrist.x) / 2;
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;

    // Calculamos la dirección de movimiento en el eje X y Y
    const directionX = avgWristX > lastDirectionXSide ? 'right' : 'left';
    const directionY = avgWristY > lastDirectionYSide ? 'up' : 'down';

    // Verificamos si ha habido un cambio de dirección (indicando que el brazo se elevó lateralmente)
    if (lastDirectionXSide && lastDirectionYSide) {
      if ((lastDirectionXSide !== directionX && lastDirectionYSide !== directionY) || 
          (lastDirectionXSide === directionX && lastDirectionYSide !== directionY)) {
        sideRaisesCounter++; // Aumentamos el contador de elevaciones laterales

        // Umbral para completar una elevación lateral (ajustable)
        const sideRaiseThreshold = userParams.sideRaiseThreshold || 30;

        if (sideRaisesCounter >= sideRaiseThreshold) {
          sideRaisesCounter = 0; // Reseteamos el contador después de completar una elevación lateral
          return true; // Elevación lateral completa detectada
        }
      }
    }

    // Guardamos la última posición para detectar cambios de dirección
    lastDirectionXSide = avgWristX;
    lastDirectionYSide = avgWristY;
  }
  return false; // Si no se detecta una elevación lateral completa
}

// Función para detectar "Encogimiento de hombros"
function detectEncogimientodehombros(keypoints, userParams = {hombrosThreshold: 15}) {
  // Buscar las posiciones de los hombros (puntos clave)
  const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
  const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
  
  // Comprobamos si las posiciones de los hombros tienen una alta precisión
  if (leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
    // Calculamos la diferencia de posiciones entre ambos hombros (en el eje Y)
    const deltaY = rightShoulder.y - leftShoulder.y;
    
    // Umbral para el encogimiento de hombros (ajustable)
    const hombrosThreshold = userParams.hombrosThreshold || 15;
    
    // Verificamos si la diferencia en el eje Y es mayor al umbral, indicando un encogimiento de hombros
    if (deltaY > hombrosThreshold) {
      if (!exerciseState.Encogimientodehombros) {
        exerciseState.Encogimientodehombros = true; // Marcamos el ejercicio como realizado
        return true; // Movimiento correcto detectado
      }
    } else {
      exerciseState.Encogimientodehombros = false; // Si la diferencia no supera el umbral, no se detecta el movimiento
    }
  }
  return false; // Si no se detecta el movimiento de encogimiento de hombros
}

// Función para detectar "Estiramiento del Cuello"
function detectEstiramientodelcuello(keypoints, userParams = {estiramientoThreshold: 15}) {
  // Buscar las posiciones de la nariz y los ojos (puntos clave)
  const nose = keypoints.find(k => k.name === 'nose');
  const leftEye = keypoints.find(k => k.name === 'left_eye');
  const rightEye = keypoints.find(k => k.name === 'right_eye');

  // Comprobamos si las posiciones de la nariz y los ojos tienen una alta precisión
  if (nose.score > 0.5 && leftEye.score > 0.5 && rightEye.score > 0.5) {
    // Calculamos la diferencia de posiciones entre los ojos (en el eje X y Y)
    const deltaX = rightEye.x - leftEye.x;
    const deltaY = rightEye.y - leftEye.y;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Calculamos el ángulo de inclinación

    // Umbral para el estiramiento del cuello (ajustable)
    const estiramientoThreshold = userParams.estiramientoThreshold || 15;

    // Verificamos si el ángulo de inclinación es mayor al umbral, indicando un movimiento de estiramiento
    if (angle > estiramientoThreshold || angle < -estiramientoThreshold) {
      if (!exerciseState.Estiramientodelcuello) {
        exerciseState.Estiramientodelcuello = true; // Marcamos el ejercicio como realizado
        return true; // Movimiento correcto detectado
      }
    } else {
      exerciseState.Estiramientodelcuello = false; // Si el ángulo no supera el umbral, no se detecta el movimiento
    }
  }
  return false; // Si no se detecta el movimiento de estiramiento
}

// Función para detectar "Flexión Lateral del Tronco"
function detectFlexionlateraldeltronco(keypoints, userParams = {flexionThreshold: 20}) {
  // Buscar las posiciones de la cadera y las muñecas (puntos clave)
  const leftHip = keypoints.find(k => k.name === 'left_hip');
  const rightHip = keypoints.find(k => k.name === 'right_hip');
  const leftWrist = keypoints.find(k => k.name === 'left_wrist');
  const rightWrist = keypoints.find(k => k.name === 'right_wrist');

  // Comprobamos si las posiciones de la cadera y las muñecas tienen una alta precisión
  if ((leftHip.score > 0.5 && leftWrist.score > 0.5) || 
      (rightHip.score > 0.5 && rightWrist.score > 0.5)) {

    // Elegimos la cadera con mayor precisión y la muñeca correspondiente
    const hip = leftHip.score > rightHip.score ? leftHip : rightHip;
    const wrist = leftWrist.score > rightWrist.score ? leftWrist : rightWrist;

    // Calculamos la diferencia entre las posiciones de la muñeca y la cadera
    const deltaX = wrist.x - hip.x;
    const deltaY = wrist.y - hip.y;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // Calculamos el ángulo de flexión lateral

    // Umbral para la flexión lateral (ajustable)
    const flexionThreshold = userParams.flexionThreshold || 20;

    // Verificamos si el ángulo de flexión es mayor al umbral, indicando un movimiento de flexión lateral
    if (angle > flexionThreshold || angle < -flexionThreshold) {
      if (!exerciseState.Flexionlateraldeltronco) {
        exerciseState.Flexionlateraldeltronco = true; // Marcamos el ejercicio como realizado
        return true; // Movimiento correcto detectado
      }
    } else {
      exerciseState.Flexionlateraldeltronco = false; // Si el ángulo no supera el umbral, no se detecta el movimiento
    }
  }
  return false; // Si no se detecta el movimiento de flexión lateral
}


      // Inicializar todo
      async function init() {
        await setupCamera();
        await loadPoseModel();
      }
      
      init(); // Iniciar la aplicación
      
