// Función para comparar avances semanales y enviar notificaciones
export function notificarMejoraRetroceso(avancesActuales, avancesAnteriores) {
    const semanaActual = Object.keys(avancesActuales);
    const mejora = avancesActuales[semanaActual] > avancesAnteriores[semanaActual];
  
    if (mejora) {
      console.log("¡Felicidades! Has mejorado tu rendimiento.");
    } else {
      console.log("Estás retrocediendo, sigue practicando.");
    }
  }
  