'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputOther = document.querySelector('.form__input--descripion');
const btnFavorite = document.querySelector('.favorite--add');
const btnFavRem = document.querySelector('.favorite--remove');
const btnNavTo = document.querySelector('.navigate');
const btnCurLoc = document.querySelector('.current');
const btnSubmit = document.querySelector('.submit');
const btnCloseNav = document.querySelector('.navigate--off');
const btnDelAllWork = document.querySelector('.del_all_work');
const leafleatContainer = document.querySelector('.leaflet-top');

//---------------------Leaflet--open source map
// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution:
//     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coordinates, distance, duration) {
    this.coordinates = coordinates;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    if (this.type === 'other') {
      this.description = `${
        this.activity[0].toUpperCase() + this.activity.slice(1)
      } on ${this.date.getDate()}.${
        this.date.getMonth() + 1
      }.${this.date.getFullYear()}`;
    } else {
      this.description = `${
        this.type[0].toUpperCase() + this.type.slice(1)
      } on ${this.date.getDate()}.${
        this.date.getMonth() + 1
      }.${this.date.getFullYear()}`;
    }
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coordinates, distance, duration, elevation) {
    super(coordinates, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class Hiking extends Workout {
  type = 'hiking';
  constructor(coordinates, distance, duration, elevation) {
    super(coordinates, distance, duration);
    this.elevation = elevation;
    this.abstractTime();
    this._setDescription();
  }
  abstractTime() {
    this.time = this.distance / (3.5 / 60);
  } //average speed for trails is around 3.5km/h
}
class Ski extends Workout {
  type = 'ski';
  constructor(coordinates, distance, duration, elevation) {
    super(coordinates, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class Other extends Workout {
  type = 'other';
  constructor(coordinates, distance, duration, activity) {
    super(coordinates, distance, duration);
    this.activity = activity;
    this._setDescription();
  }
}

//////////////////////////////////////////////////////////////////////
class Application {
  #map;
  #mapEvent;
  #activities = [];
  #placeToVisit = [];
  workout;
  coords;
  routingControl = null;
  constructor() {
    this._getPosition();
    this._getLocalStorage();

    inputType.addEventListener('change', this._toogleElevationCadance); //Whwn change type of workout
    containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
    form.addEventListener('submit', this._newWorkout.bind(this)); //Submiting the form for workout
    btnSubmit.addEventListener('click', this._newWorkout.bind(this)); //Submiting the form for workout
    btnFavorite.addEventListener('click', this._placesToVisit.bind(this));
    btnNavTo.addEventListener('click', this._navigateTo.bind(this));
    btnCloseNav.addEventListener('click', this._stopNavigation.bind(this));
    btnCurLoc.addEventListener('click', this._zoomToCurrentLocation.bind(this));
    btnDelAllWork.addEventListener('click', this._delAllWork);
    btnFavRem.addEventListener('click', this._removeAllFav);

    form.addEventListener('keydown', e => {
      if (e.key === 'Escape') this._hideForm();
    });
    this.marrkerArray = [];
  }
  _getPosition() {
    //Getting position from brouser

    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function fail() {
          alert(' Please enable location sharing in web browser. ');
        }
      );
  }
  _loadMap(position) {
    //Loading map

    const { latitude, longitude } = position.coords;
    this.coords = [latitude, longitude]; //---------------------------
    this.#map = L.map('map').setView([latitude, longitude], 10);
    //-------------------------------------------------------Bind to google maps
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(this.#map);
    //-------------------------------------------Icon for current location
    const myIcon = L.icon({
      iconUrl: 'my-icon.png',
      iconSize: [30, 30],
    });

    L.marker([latitude, longitude], { icon: myIcon })
      .addTo(this.#map)
      .bindPopup('You are here');

    this.#map.on('click', this._showForm.bind(this));
    this.#activities.forEach(work => this._renderActivities(work));
    this._zoomToCurrentLocation();
    this._getFavPlaces();
  }
  _showForm(event) {
    //For showing the form
    this.#mapEvent = event;
    form.classList.remove('hidden'); //Form for events with class in html
    inputDistance.focus();
  }
  _toogleElevationCadance() {
    // visabylite fields for each type of workout
    if (inputType.value === 'running') {
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputOther.closest('.form__row').classList.add('form__row--hidden');
    }
    if (inputType.value === 'other') {
      inputOther.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
    }
    if (inputType.value === 'hiking') {
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputOther.closest('.form__row').classList.add('form__row--hidden');
    }
    if (inputType.value === 'ski') {
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputOther.closest('.form__row').classList.add('form__row--hidden');
    }
    if (inputType.value === 'cycling') {
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputOther.closest('.form__row').classList.add('form__row--hidden');
    }
  }
  _newWorkout(e) {
    //------------------------------------------------------------------Submiting the form
    if (!this.#mapEvent) return this._beforeClickEvent();
    const validateInput = (...input) =>
      input.every(inp => Number.isFinite(inp));
    const allPositive = (...input) => input.every(inp => inp > 0);

    e.preventDefault();
    const type = inputType.value; //Input running or cycling
    const distance = Number(inputDistance.value); //input distance
    const duration = Number(inputDuration.value); //input duration
    const { lat, lng } = this.#mapEvent.latlng; // coordinates
    const notValidPopUp = L.popup([lat, lng], {
      content: '<p>Not valid data<br />Please enter valid data</p>',
      autoClose: false,
      closeOnClick: true,
    });
    /*
L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`);
    // .openPopup();.openPopup();



*/
    if (type === 'running') {
      //for running input cadence
      const cadence = Number(inputCadence.value);
      //-----------------------------------------validating data
      if (
        !validateInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return notValidPopUp.openOn(this.#map) && this._hideForm();
      this.workout = new Running([lat, lng], distance, duration, cadence); //Making new object for running
    }
    if (type === 'cycling') {
      //for cycling input elevation
      const elevation = Number(inputElevation.value);
      if (
        !validateInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return notValidPopUp.openOn(this.#map) && this._hideForm();
      this.workout = new Cycling([lat, lng], distance, duration, elevation); //Making new object for cycling
    }
    if (type === 'hiking') {
      const elevation = Number(inputElevation.value);
      if (
        !validateInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return notValidPopUp.openOn(this.#map) && this._hideForm();
      this.workout = new Hiking([lat, lng], distance, duration, elevation); //Making new object for hiking
    }
    if (type === 'ski') {
      const elevation = Number(inputElevation.value);
      if (
        !validateInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return notValidPopUp.openOn(this.#map) && this._hideForm();
      this.workout = new Ski([lat, lng], distance, duration, elevation); //Making new object for ski
    }
    if (type === 'other') {
      const activity = inputOther.value;
      if (!validateInput(duration) || !allPositive(duration))
        return notValidPopUp.openOn(this.#map) && this._hideForm();
      this.workout = new Other([lat, lng], distance, duration, activity); //Making new object for other
    }

    this.#activities.push(this.workout); //Push maked object in array
    this.#placeToVisit.pop(this.#mapEvent.latlng);
    this._renderWorkout(this.workout);
    this._renderActivities(this.workout);

    this._setLocalStorage();
  }
  _renderWorkout(workout) {
    //html for every activity

    let html = '';
    if (workout.type === 'running') {
      html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <button class="btn--delete-workout">&times;</button>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
                <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          </li>
         `;
    }
    if (workout.type === 'cycling') {
      html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <button class="btn--delete-workout">&times;</button>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">🚴‍♀️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🌄</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
         `;
    }
    if (workout.type === 'hiking') {
      html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <button class="btn--delete-workout">&times;</button>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">🧗🏻‍♂️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⌛️</span>
            <span class="workout__value">${workout.time.toFixed(2)}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🌄</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
         `;
    }
    if (workout.type === 'ski') {
      html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <button class="btn--delete-workout">&times;</button>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">🏂🏻</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🌄</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
         `;
    }
    if (workout.type === 'other') {
      html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <button class="btn--delete-workout">&times;</button>
          <h2 class="workout__title">${workout.description} </h2>
          <div class="workout__details">
            <span class="workout__icon">🤸🏻‍♂️</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        </li>
         `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _renderActivities(workout) {
    //-------------------Showing the marker
    const activityPin = L.icon({
      iconUrl: 'activityPin.png',
      iconSize: [35, 37],
    });
    let marker = L.marker(workout.coordinates, { icon: activityPin })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`);
    // .openPopup();

    this.marrkerArray.push(marker);
    this._hideForm();
    this._zoomToAllMarkersOnMap();
  }
  _zoomToAllMarkersOnMap() {
    if (this.marrkerArray.length > 1) {
      let latlngs = this.marrkerArray.map(marker => marker.getLatLng());

      let latlngBounds = L.latLngBounds(latlngs);
      this.#map.fitBounds(latlngBounds);
    }
  }
  _hideForm() {
    //----------------Clearing fields and hide form

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _moveToMarker(e) {
    //moving selected activite to setted zoom level and map
    const selectEl = e.target.closest('.workout');
    if (!selectEl) return;
    const chechEl = this.#activities.find(
      activity => activity.id === selectEl.dataset.id
    );
    this.#map.setView(chechEl.coordinates, 10, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#activities));
    localStorage.setItem('placeToVisit', JSON.stringify(this.#placeToVisit));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#activities = data;
    this.#activities.forEach(work => this._renderWorkout(work));
    const btnDelWorkout = document.querySelectorAll('.btn--delete-workout');
    btnDelWorkout.forEach(e =>
      e.addEventListener('click', e => {
        this._deleteWorkout(e);
      })
    );
  }
  _deleteWorkout(e) {
    const element = e.target.closest('.workout');
    if (!element) return;
    const delEl = this.#activities.find(
      activity => activity.id === element.dataset.id
    );
    const removed = this.#activities.filter(el => el !== delEl);
    this.#activities = removed;
    this._setLocalStorage();
    location.reload();
  }
  _beforeClickEvent() {
    L.popup(this.coords, {
      content: '<p>First you have to choose a place on map</p>',
      autoClose: false,
      closeOnClick: true,
    }).openOn(this.#map);
  }
  _placesToVisit() {
    if (!this.#mapEvent) return this._beforeClickEvent();
    this.#map.on('click', this._showForm.bind(this));
    const { lat, lng } = this.#mapEvent.latlng;
    this._marker(lat, lng);
    this._setLocalStorage();
    this._hideForm();
    this.#placeToVisit.push(this.#mapEvent.latlng);
  }
  _getFavPlaces() {
    const data = JSON.parse(localStorage.getItem('placeToVisit'));
    if (!data) return;
    this.#placeToVisit = data;
    data.forEach(plc => {
      let { lat, lng } = plc;
      this._marker(lat, lng);
    });
  }
  _delAllWork() {
    localStorage.removeItem('workouts');
    location.reload();
  }
  _removeAllFav() {
    localStorage.removeItem('placeToVisit');
    app._reloadMap();
    // this._reloadMap.bind(this);
  }
  _marker(lat, lng) {
    const favIcon = L.icon({
      iconUrl: 'favIcon.png',
      iconSize: [20, 30],
    });
    if (!this.#map) return;
    L.marker([lat, lng], { icon: favIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
        })
      )
      .setPopupContent(`Place to visit`);
  }
  _zoomToCurrentLocation() {
    //zooming to current location on device
    this.#map.setView(this.coords, 10);
    this._hideForm();
  }
  _navigateTo() {
    if (!this.#mapEvent) return this._beforeClickEvent();
    this._hideForm();
    let { lat, lng } = this.#mapEvent.latlng;
    if (this.routingControl) {
      L.popup([lat, lng], {
        content:
          '<p>Your navigation is running.<br />You must stop it first before .<br />you can play it again!</p>',
      }).openOn(this.#map);
      return;
    }
    this.routingControl = L.Routing.control({
      waypoints: [L.latLng(this.coords), L.latLng(lat, lng)],
    }).addTo(this.#map);
    lat = lng = null;
  }
  _stopNavigation() {
    if (!this.#mapEvent) return this._beforeClickEvent();
    if (this.routingControl != null) {
      this._reloadMap();
      this.routingControl = null;
    }
  }
  _reloadMap() {
    this.#map.off();
    this.#mapEvent = '';
    this.#map.remove();
    this._getPosition();
  }
}
const app = new Application();
