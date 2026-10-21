# Casilla · Nonogramas

Una web para resolver nonogramas sin prisa. Frontend local en React, TypeScript y Vite, con ocho puzzles de 10×10 a 50×50. No requiere backend, cuentas ni claves. Las fuentes se sirven desde el propio proyecto.

## Ejecutar

Requiere Node.js 22.12+ o 24+ y npm.

```sh
npm install
npm run dev
```

Abrí la dirección local que imprime Vite. Para generar una versión estática:

```sh
npm run build
npm run preview
```

El contenido de `dist/` se puede servir con cualquier servidor estático. Este proyecto no tiene un despliegue configurado.

## Jugar

El tablero utiliza toda la altura disponible de la ventana. Las herramientas, el tiempo y las ayudas se agrupan en una barra lateral con desplazamiento propio; en pantallas pequeñas se convierten en un panel superior compacto. El catálogo tiene su propia página y se vuelve a él mediante el botón «Volver al catálogo». Cada puzzle se ajusta al espacio disponible al seleccionarlo; el zoom manual sigue disponible.

- Clic izquierdo pinta; clic derecho cruza. Repetir una marca la borra.
- Mantené el botón y arrastrá para marcar varias casillas con la misma acción. El primer movimiento bloquea el trazo a una fila o columna hasta soltar el botón, aunque el cursor se desvíe. El arrastre se deshace completo.
- Las herramientas permiten pintar, cruzar, borrar y desplazar el tablero. La herramienta mano también permite desplazarse con el dedo en pantallas táctiles; la rueda y las barras de desplazamiento funcionan en escritorio.
- Enfocá el tablero haciendo clic o con Tab. Las flechas recorren las casillas; **Espacio** pinta, **X** cruza y **Supr/Backspace** borra.
- Con el tablero enfocado, **Ctrl/⌘ Z** deshace, **Ctrl/⌘ Shift Z** o **Ctrl/⌘ Y** rehace.
- Al pintar el último grupo de una fila o columna, las casillas restantes se cruzan automáticamente con un destello suave y una aparición escalonada. Se comparan los grupos con las pistas, sin consultar las posiciones ocultas de la solución. Las cruces automáticas se deshacen junto con el movimiento; borrar una cruz manualmente no la vuelve a crear de inmediato. Se respeta la preferencia del sistema de reducir animaciones.
- Clic en un número tacha o destacha esa pista; es una anotación manual y no confirma que el grupo sea correcto.
- Usá **+**, **−** y **Ajustar tablero** para cambiar el tamaño de las casillas. Si el tablero no entra, mantené las pistas visibles al desplazarte.
- **Revisar errores** señala solamente marcas incorrectas: pintura sobre vacío o cruces sobre casillas de la solución. No revela las casillas que faltan. La limpieza de errores también puede deshacerse.
- Una solución se completa al pintar exactamente el dibujo; no hace falta cruzar todos los espacios vacíos. No hay vidas ni penalizaciones.

El porcentaje indica casillas con alguna marca (pintura o cruz), no exactitud de la solución. El tiempo empieza al realizar una marca y se detiene al pausar, completar, abrir un diálogo o esconder la pestaña.

## Catálogo y victoria

La página inicial muestra el catálogo con filtros y progreso. Las rutas usan fragmentos (`#/catalogo` y `#/jugar/<id>`), de modo que los enlaces directos, recargar y los botones Atrás/Adelante funcionan en hosting estático. Los dibujos pendientes permanecen ocultos; los completados muestran su ilustración en el catálogo. El tiempo se detiene al volver al catálogo.

Al pasar de una partida sin resolver a resuelta, un barrido de 1,5 segundos revela el dibujo a color sobre el tablero. Después se abre un modal con la imagen completa, el tiempo y acceso al siguiente puzzle. «Ver imagen» permite reabrirlo. Recuperar una partida ya terminada muestra el color sin repetir la celebración. Cambiar de página o deshacer la victoria cancela cualquier apertura pendiente. La preferencia de reducir movimiento omite el barrido y abre directamente la imagen.

## Guardado

`localStorage` conserva selección, marcas, tiempo y pistas tachadas por puzzle bajo `casilla:progress:v1`. El guardado es automático y local a ese navegador y origen (host/puerto). No se sincroniza entre dispositivos; borrar los datos del navegador elimina el progreso. La interfaz informa si el navegador bloquea el guardado.

El historial de deshacer/rehacer se mantiene mientras la aplicación está abierta (hasta 300 movimientos); no se recupera después de recargar. Reiniciar un puzzle pide confirmación y no altera los demás. Los datos inválidos o de otra versión se descartan de forma segura.

## Organización

- `src/catalog.ts`: catálogo y dibujos binarios, sin previsualizaciones que revelen la solución.
- `src/types.ts`, `src/engine.ts`: contratos de puzzle/partida, pistas, errores, victoria e historial.
- `src/storage.ts`: validación y persistencia versionada.
- `src/components/Board.tsx`: pistas fijas, puntero, arrastre, teclado y desplazamiento.
- `src/App.tsx`: catálogo, controles, tiempo, ayudas y diálogos.
- `scripts/solver.ts`: validador por programación dinámica, propagación y búsqueda; no se incluye en el bundle de juego.

## Incorporar puzzles y futuro conversor

Agregá una definición a `catalog` con un `id` estable y único. `solution` es un arreglo de `0 | 1`, en orden de filas, de longitud `width * height`. `1` representa una casilla pintada. El juego calcula las pistas a partir de esa solución. El campo opcional `colors: string[]` conserva el color de cada píxel original, incluido el fondo, en el mismo orden y con la misma longitud que `solution`. Los ocho dibujos actuales incluyen paletas propias, creadas para sus siluetas binarias. Si un puzzle no tiene colores, se usa una imagen monocromática.

```ts
const puzzle: Puzzle = {
  id: "mi-puzzle-v1",
  title: "Mi puzzle",
  collection: "Mi colección",
  width: 3,
  height: 3,
  solution: [0, 1, 0, 1, 1, 1, 0, 1, 0],
};
```

Mantené el ID si la definición no cambia; usá un ID nuevo al modificar el dibujo para evitar reutilizar progreso de otra solución. Los dos tableros de 50×50 se dibujan a resolución nativa, con detalles propios. Los puzzles menores usan siluetas de pixel art.

Un futuro conversor de imágenes debe producir este mismo contrato y validar su unicidad antes de incorporarlo. La carga de imágenes, el recorte, los umbrales y un editor no forman parte de esta versión.

## Verificación

```sh
npm test
npm run validate:catalog
npm run build
```

Las pruebas cubren reglas, historial, limpieza de errores, almacenamiento inválido/bloqueado, dimensiones y unicidad de los ocho puzzles. El solver también se contrasta con conteos exhaustivos de todos los tableros posibles de 3×3, para comprobar que detecta soluciones múltiples. La validación falla si encuentra ambigüedad o agota el presupuesto de búsqueda.

Validación manual de navegador: arrastre y deshacer/rehacer en 50×50, clic derecho, teclado, pistas tachadas, zoom, pistas fijas en ambos ejes, revisión y limpieza, persistencia tras recargar, pausa, reinicio y vista de 390 px sin desbordamiento horizontal de la página.
