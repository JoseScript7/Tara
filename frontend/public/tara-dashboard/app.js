const roomImage = document.getElementById("roomImage");

const threeD = document.getElementById("threeD");
const topView = document.getElementById("topView");

const minus = document.getElementById("minus");
const plus = document.getElementById("plus");
const reset = document.getElementById("reset");

let scale = 1;

function updateImage() {
  roomImage.style.transform =
    `scale(${scale})`;
}


/* ZOOM IN */

plus.addEventListener("click", () => {

  scale = Math.min(
    scale + 0.1,
    1.5
  );

  updateImage();

});


/* ZOOM OUT */

minus.addEventListener("click", () => {

  scale = Math.max(
    scale - 0.1,
    0.7
  );

  updateImage();

});


/* RESET */

reset.addEventListener("click", () => {

  scale = 1;

  roomImage.style.transform =
    "scale(1)";

  threeD.classList.add("active");
  topView.classList.remove("active");

});


/*
  3D VIEW
*/

threeD.addEventListener("click", () => {

  threeD.classList.add("active");

  topView.classList.remove("active");

  roomImage.style.transform =
    `scale(${scale})`;

});


/*
  TOP VIEW

  This keeps the reference image intact.
  Replace the image with a real top-view
  render when you have one.
*/

topView.addEventListener("click", () => {

  topView.classList.add("active");

  threeD.classList.remove("active");

  roomImage.style.transform =
    `
      scale(${scale})
      rotateX(4deg)
    `;

});
