const checkinInput = document.getElementById('checkin');
const checkoutInput = document.getElementById('checkout');


const today = new Date();
const nextYear = new Date(today);
nextYear.setFullYear(today.getFullYear() + 1);


const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


checkinInput.min = formatDate(today);
checkinInput.max = formatDate(nextYear);
checkoutInput.min = formatDate(today);
checkoutInput.max = formatDate(nextYear);
checkoutInput.disabled = true;

checkinInput.addEventListener('change', function() {
  if (this.value) {
    const checkinDate = new Date(this.value);
    const nextDay = new Date(checkinDate);
    nextDay.setDate(checkinDate.getDate() + 1);
    
    checkoutInput.min = formatDate(nextDay);
    checkoutInput.disabled = false;
    checkoutInput.value = '';
  } else {
    checkoutInput.disabled = true;
  }
});


const spaceTypeSelect = document.getElementById('spaces-type');
const spacesInput = document.getElementById('space-no');
const peopleInput = document.getElementById('people-no');


function updateLimits() {
  const selectedOption = spaceTypeSelect.selectedOptions[0];
  const maxSpaces = parseInt(selectedOption.dataset.maxSpaces);
  const maxPeoplePerSpace = parseInt(selectedOption.dataset.maxPeople);

  
  spacesInput.max = maxSpaces;
  spacesInput.placeholder = `Max ${maxSpaces}`;


  if (parseInt(spacesInput.value) > maxSpaces) {
    spacesInput.value = maxSpaces;
  }
  if ((parseInt(spacesInput.value) < spacesInput.min) || !spacesInput.value){
    spacesInput.value = spacesInput.min;
  }

  const maxPeopleTotal = maxPeoplePerSpace * spacesValue;
  peopleInput.max = maxPeopleTotal;
  peopleInput.placeholder = `Max ${maxPeopleTotal}`;

  
  let peopleValue = parseInt(peopleInput.value) || 1;
  if (peopleValue > maxPeopleTotal) peopleValue = maxPeopleTotal;
  if (peopleValue < 1) peopleValue = 1;
  peopleInput.value = peopleValue;
}

spaceTypeSelect.addEventListener('change', updateLimits);
spacesInput.addEventListener('input', updateLimits);

document.addEventListener('DOMContentLoaded', () => {
  updateLimits();
  

  document.querySelector('form').addEventListener('submit', (e) => {
    if (parseInt(spacesInput.value) > parseInt(spacesInput.max)) {
      e.preventDefault();
      alert('Ο αριθμός των χώρων υπερβαίνει το διαθέσιμο');
    }
  });
});