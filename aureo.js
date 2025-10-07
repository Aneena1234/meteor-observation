/* ================================
   🌠 Aureo Meteor Observation JS
   ================================ */

// ---------- LOGIN SYSTEM ----------
const loginForm = document.getElementById("login-form");
const loginScreen = document.getElementById("login-screen");
const mainSite = document.getElementById("main-site");
const logoutBtn = document.getElementById("logoutBtn");

loginForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const loadingIndicator = document.getElementById("loading-indicator");
 
  // Show loading indicator
  loadingIndicator.style.display = "block";
 
  // Simulate a brief loading period to ensure smooth transition
  setTimeout(() => {
    localStorage.setItem("aureoUser", name);
    loginScreen.style.display = "none";
    mainSite.style.display = "block";
    fetchMeteorData(); // Load live data after login
  }, 500);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("aureoUser");
  mainSite.style.display = "none";
  loginScreen.style.display = "block";
});

// Ensure CSS is loaded before showing content
function waitForCSS() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

// Auto-login if user exists
window.addEventListener("load", async () => {
  // Wait for CSS to load
  await waitForCSS();
 
  // Initialize meteor animation first
  try {
    new MeteorAnimation();
  } catch (error) {
    console.error("Failed to initialize meteor animation:", error);
  }
 
  // Check for existing user
  if (localStorage.getItem("aureoUser")) {
    loginScreen.style.display = "none";
    mainSite.style.display = "block";
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      fetchMeteorData();
    }, 100);
  }
});

// ---------- SCROLL HELPER ----------
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

// ---------- AR VIEW FUNCTIONALITY ----------
class ARView {
  constructor() {
    this.modal = document.getElementById('ar-modal');
    this.video = document.getElementById('ar-camera');
    this.overlay = document.getElementById('ar-overlay');
    this.ctx = this.overlay.getContext('2d');
    this.stream = null;
    this.currentFacingMode = 'environment';
    this.infoVisible = true;
    this.meteorShowers = [
      { name: 'Perseids', direction: 'Northeast', time: 'After midnight', peak: 'August 12-13' },
      { name: 'Geminids', direction: 'East', time: 'Evening to dawn', peak: 'December 13-14' },
      { name: 'Quadrantids', direction: 'North', time: 'Early morning', peak: 'January 3-4' },
      { name: 'Leonids', direction: 'East', time: 'Late night', peak: 'November 17-18' },
      { name: 'Lyrids', direction: 'Northeast', time: 'Late night', peak: 'April 21-22' },
      { name: 'Orionids', direction: 'Southeast', time: 'After midnight', peak: 'October 20-21' }
    ];
    this.currentShowerIndex = 0;
   
    // Meteor detection properties
    this.meteorDetected = false;
    this.detectionStartTime = Date.now();
    this.lastDetectionTime = 0;
    this.tiltDirection = 'left'; // 'left' or 'right'
    this.detectionZone = { x: 0.3, y: 0.3, width: 0.4, height: 0.4 }; // Center 40% of screen
    this.meteorMessage = document.getElementById('meteor-message');
    this.tiltInstructions = document.getElementById('tilt-instructions');
    this.tiltArrow = document.getElementById('tilt-arrow');
    this.tiltText = document.getElementById('tilt-text');
   
    // Examples sidebar properties
    this.examplesSidebar = document.getElementById('examples-sidebar');
    this.examplesVisible = false;
   
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateShowerInfo();
    this.startOverlayAnimation();
  }

  setupEventListeners() {
    document.getElementById('close-ar').addEventListener('click', () => this.close());
    document.getElementById('toggle-camera').addEventListener('click', () => this.toggleCamera());
    document.getElementById('toggle-info').addEventListener('click', () => this.toggleInfo());
    document.getElementById('toggle-examples').addEventListener('click', () => this.toggleExamples());
    document.getElementById('close-examples').addEventListener('click', () => this.closeExamples());
   
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display !== 'none') {
        if (this.examplesSidebar && this.examplesSidebar.style.display !== 'none') {
          this.closeExamples();
        } else {
          this.close();
        }
      }
    });
  }

  async open() {
    this.modal.style.display = 'flex';
    try {
      await this.startCamera();
      this.resizeOverlay();
    } catch (error) {
      console.error('Failed to start camera:', error);
      this.showCameraError();
    }
  }

  close() {
    this.modal.style.display = 'none';
    this.stopCamera();
    this.closeExamples();
  }

  toggleExamples() {
    if (this.examplesVisible) {
      this.closeExamples();
    } else {
      this.openExamples();
    }
  }

  openExamples() {
    this.examplesSidebar.style.display = 'block';
    this.examplesVisible = true;
    // Add show class after a small delay to trigger animation
    setTimeout(() => {
      this.examplesSidebar.classList.add('show');
    }, 10);
  }

  closeExamples() {
    this.examplesSidebar.classList.remove('show');
    this.examplesVisible = false;
    // Hide after animation completes
    setTimeout(() => {
      this.examplesSidebar.style.display = 'none';
    }, 300);
  }

  async startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: this.currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
     
      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });
    } catch (error) {
      throw new Error('Camera access denied or not available');
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async toggleCamera() {
    this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
    this.stopCamera();
    try {
      await this.startCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }

  toggleInfo() {
    this.infoVisible = !this.infoVisible;
    const infoPanel = document.querySelector('.ar-info-panel');
    infoPanel.style.display = this.infoVisible ? 'block' : 'none';
  }

  updateShowerInfo() {
    const shower = this.meteorShowers[this.currentShowerIndex];
    document.getElementById('current-shower').textContent = shower.name;
    document.getElementById('shower-direction').textContent = shower.direction;
    document.getElementById('best-time').textContent = shower.time;
  }

  resizeOverlay() {
    const rect = this.video.getBoundingClientRect();
    this.overlay.width = rect.width;
    this.overlay.height = rect.height;
  }

  startOverlayAnimation() {
    const animate = () => {
      if (this.modal.style.display !== 'none') {
        this.drawOverlay();
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  drawOverlay() {
    this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
   
    // Draw compass
    this.drawCompass();
   
    // Draw meteor shower direction indicator
    this.drawShowerDirection();
   
    // Draw constellation lines (simplified)
    this.drawConstellationLines();
   
    // Draw detection zone
    this.drawDetectionZone();
   
    // Update meteor detection
    this.updateMeteorDetection();
   
    // Cycle through different meteor showers every 10 seconds
    if (Math.floor(Date.now() / 10000) % this.meteorShowers.length !== this.currentShowerIndex) {
      this.currentShowerIndex = Math.floor(Date.now() / 10000) % this.meteorShowers.length;
      this.updateShowerInfo();
    }
  }

  drawCompass() {
    const centerX = this.overlay.width - 80;
    const centerY = 80;
    const radius = 50;

    // Draw compass circle
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Draw cardinal directions
    this.ctx.fillStyle = '#ff6ec4';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('N', centerX, centerY - radius - 5);
    this.ctx.fillText('S', centerX, centerY + radius + 15);
    this.ctx.fillText('E', centerX + radius + 5, centerY + 5);
    this.ctx.fillText('W', centerX - radius - 5, centerY + 5);
  }

  drawShowerDirection() {
    const shower = this.meteorShowers[this.currentShowerIndex];
    const centerX = this.overlay.width / 2;
    const centerY = this.overlay.height / 2;
   
    // Convert direction to angle
    const directionAngles = {
      'North': -Math.PI / 2,
      'Northeast': -Math.PI / 4,
      'East': 0,
      'Southeast': Math.PI / 4,
      'South': Math.PI / 2,
      'Southwest': 3 * Math.PI / 4,
      'West': Math.PI,
      'Northwest': -3 * Math.PI / 4
    };
   
    const angle = directionAngles[shower.direction] || 0;
    const length = 100;
   
    // Draw direction arrow
    this.ctx.strokeStyle = '#ff6ec4';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );
    this.ctx.stroke();
   
    // Draw arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );
    this.ctx.lineTo(
      centerX + Math.cos(angle) * (length - 20) + Math.cos(angle + Math.PI / 6) * 15,
      centerY + Math.sin(angle) * (length - 20) + Math.sin(angle + Math.PI / 6) * 15
    );
    this.ctx.moveTo(
      centerX + Math.cos(angle) * length,
      centerY + Math.sin(angle) * length
    );
    this.ctx.lineTo(
      centerX + Math.cos(angle) * (length - 20) + Math.cos(angle - Math.PI / 6) * 15,
      centerY + Math.sin(angle) * (length - 20) + Math.sin(angle - Math.PI / 6) * 15
    );
    this.ctx.stroke();
   
    // Draw shower name
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      shower.name,
      centerX + Math.cos(angle) * (length + 30),
      centerY + Math.sin(angle) * (length + 30)
    );
  }

  drawConstellationLines() {
    // Draw some simplified constellation lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
   
    // Random constellation-like lines
    for (let i = 0; i < 5; i++) {
      this.ctx.beginPath();
      const startX = Math.random() * this.overlay.width;
      const startY = Math.random() * this.overlay.height;
      this.ctx.moveTo(startX, startY);
     
      for (let j = 0; j < 3; j++) {
        const endX = startX + (Math.random() - 0.5) * 100;
        const endY = startY + (Math.random() - 0.5) * 100;
        this.ctx.lineTo(endX, endY);
      }
      this.ctx.stroke();
    }
  }

  drawDetectionZone() {
    // Draw the meteor detection zone
    const zoneX = this.overlay.width * this.detectionZone.x;
    const zoneY = this.overlay.height * this.detectionZone.y;
    const zoneWidth = this.overlay.width * this.detectionZone.width;
    const zoneHeight = this.overlay.height * this.detectionZone.height;
   
    this.ctx.strokeStyle = 'rgba(255, 110, 196, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 5]);
    this.ctx.strokeRect(zoneX, zoneY, zoneWidth, zoneHeight);
    this.ctx.setLineDash([]);
   
    // Draw "Detection Zone" label
    this.ctx.fillStyle = 'rgba(255, 110, 196, 0.8)';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Detection Zone', zoneX + zoneWidth / 2, zoneY - 10);
  }

  updateMeteorDetection() {
    const currentTime = Date.now();
    const timeSinceStart = currentTime - this.detectionStartTime;
    const timeSinceLastDetection = currentTime - this.lastDetectionTime;
   
    // Simulate meteor detection based on time and random chance
    const detectionChance = 0.001; // 0.1% chance per frame
    const shouldDetect = Math.random() < detectionChance;
   
    // Force detection after 30 seconds if not found
    const forceDetection = timeSinceStart > 30000 && !this.meteorDetected;
   
    if ((shouldDetect || forceDetection) && !this.meteorDetected) {
      this.meteorDetected = true;
      this.lastDetectionTime = currentTime;
      this.showMeteorFound();
    } else if (!this.meteorDetected) {
      // Show "not found" message after 5 seconds
      if (timeSinceStart > 5000 && timeSinceLastDetection === 0) {
        this.showMeteorNotFound();
      }
    }
   
    // Reset detection after 15 seconds of being found
    if (this.meteorDetected && timeSinceLastDetection > 15000) {
      this.resetDetection();
    }
  }

  showMeteorFound() {
    this.meteorMessage.textContent = '🌠 Meteor Found!';
    this.meteorMessage.className = 'meteor-message found';
    this.tiltInstructions.style.display = 'none';
   
    // Add celebration effect
    this.drawCelebrationEffect();
  }

  showMeteorNotFound() {
    this.meteorMessage.textContent = '⚠️ Meteor Not Found';
    this.meteorMessage.className = 'meteor-message not-found';
    this.tiltInstructions.style.display = 'flex';
   
    // Randomly choose tilt direction
    this.tiltDirection = Math.random() < 0.5 ? 'left' : 'right';
    this.updateTiltInstructions();
  }

  updateTiltInstructions() {
    if (this.tiltDirection === 'left') {
      this.tiltArrow.textContent = '←';
      this.tiltText.textContent = 'Tilt Left';
    } else {
      this.tiltArrow.textContent = '→';
      this.tiltText.textContent = 'Tilt Right';
    }
  }

  resetDetection() {
    this.meteorDetected = false;
    this.detectionStartTime = Date.now();
    this.lastDetectionTime = 0;
    this.meteorMessage.textContent = '🔍 Searching for meteors...';
    this.meteorMessage.className = 'meteor-message searching';
    this.tiltInstructions.style.display = 'none';
  }

  drawCelebrationEffect() {
    // Draw sparkles around the detection zone
    const zoneX = this.overlay.width * this.detectionZone.x;
    const zoneY = this.overlay.height * this.detectionZone.y;
    const zoneWidth = this.overlay.width * this.detectionZone.width;
    const zoneHeight = this.overlay.height * this.detectionZone.height;
   
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    for (let i = 0; i < 20; i++) {
      const sparkleX = zoneX + Math.random() * zoneWidth;
      const sparkleY = zoneY + Math.random() * zoneHeight;
      const sparkleSize = Math.random() * 4 + 2;
     
      this.ctx.beginPath();
      this.ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  showCameraError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 2rem;
      border-radius: 10px;
      text-align: center;
      z-index: 1000;
    `;
    errorDiv.innerHTML = `
      <h3>Camera Access Required</h3>
      <p>Please allow camera access to use AR view</p>
      <button onclick="this.parentElement.remove()" style="
        background: #ff6ec4;
        border: none;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 1rem;
      ">OK</button>
    `;
    this.modal.appendChild(errorDiv);
  }
}

// Initialize AR view
let arView = null;

function openAR() {
  if (!arView) {
    arView = new ARView();
  }
  arView.open();
}

// ---------- SMART NOTIFICATIONS SYSTEM ----------
class SmartNotifications {
  constructor() {
    this.modal = document.getElementById('notification-modal');
    this.location = null;
    this.weather = null;
    this.meteorData = null;
    this.notificationSettings = {
      weatherAlerts: true,
      peakAlerts: true,
      intensityAlerts: true
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSettings();
    this.detectLocation();
  }

  setupEventListeners() {
    document.getElementById('close-notifications').addEventListener('click', () => this.close());
    document.getElementById('refresh-location').addEventListener('click', () => this.detectLocation());
    document.getElementById('test-notification').addEventListener('click', () => this.testNotification());
    document.getElementById('enable-notifications').addEventListener('click', () => this.enableNotifications());
   
    // Settings checkboxes
    document.getElementById('weather-alerts').addEventListener('change', (e) => {
      this.notificationSettings.weatherAlerts = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('peak-alerts').addEventListener('change', (e) => {
      this.notificationSettings.peakAlerts = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('intensity-alerts').addEventListener('change', (e) => {
      this.notificationSettings.intensityAlerts = e.target.checked;
      this.saveSettings();
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display !== 'none') {
        this.close();
      }
    });
  }

  async open() {
    this.modal.style.display = 'flex';
    await this.loadAllData();
  }

  close() {
    this.modal.style.display = 'none';
  }

  async detectLocation() {
    const locationElement = document.getElementById('current-location');
    const coordsElement = document.getElementById('location-coords');
   
    locationElement.textContent = 'Detecting your location...';
    coordsElement.style.display = 'none';

    try {
      const position = await this.getCurrentPosition();
      this.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      // Get city name from coordinates
      const cityName = await this.getCityFromCoords(this.location.latitude, this.location.longitude);
     
      locationElement.textContent = cityName || 'Location detected';
      document.getElementById('latitude').textContent = this.location.latitude.toFixed(4);
      document.getElementById('longitude').textContent = this.location.longitude.toFixed(4);
      coordsElement.style.display = 'block';

      // Load weather and meteor data
      await this.loadWeatherData();
      await this.loadMeteorIntensity();
      this.generateRecommendations();

    } catch (error) {
      console.error('Location detection failed:', error);
      locationElement.textContent = 'Location access denied';
      this.showLocationError();
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  async getCityFromCoords(lat, lon) {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const data = await response.json();
     
      if (data.city && data.principalSubdivision) {
        return `${data.city}, ${data.principalSubdivision}`;
      } else if (data.locality) {
        return data.locality;
      } else {
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return 'Location detected';
    }
  }

  async loadWeatherData() {
    if (!this.location) return;

    try {
      // Using OpenWeatherMap API (free tier)
      const apiKey = 'demo'; // In production, use a real API key
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${this.location.latitude}&lon=${this.location.longitude}&appid=${apiKey}&units=metric`);
     
      if (response.ok) {
        const data = await response.json();
        this.weather = {
          main: data.weather[0].main,
          description: data.weather[0].description,
          cloudCover: data.clouds.all,
          visibility: data.visibility / 1000, // Convert to km
          temperature: data.main.temp
        };
      } else {
        // Fallback to mock data
        this.weather = this.generateMockWeather();
      }
    } catch (error) {
      console.error('Weather API failed:', error);
      this.weather = this.generateMockWeather();
    }

    this.updateWeatherDisplay();
  }

  generateMockWeather() {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast'];
    const descriptions = ['Clear sky', 'Few clouds', 'Scattered clouds', 'Broken clouds'];
    const randomIndex = Math.floor(Math.random() * conditions.length);
   
    return {
      main: conditions[randomIndex],
      description: descriptions[randomIndex],
      cloudCover: Math.floor(Math.random() * 100),
      visibility: Math.floor(Math.random() * 20) + 5,
      temperature: Math.floor(Math.random() * 30) + 10
    };
  }

  updateWeatherDisplay() {
    if (!this.weather) return;

    const weatherIcon = document.querySelector('.weather-icon');
    const weatherMain = document.querySelector('.weather-main');
    const weatherDesc = document.querySelector('.weather-desc');
    const cloudCover = document.getElementById('cloud-cover');
    const visibility = document.getElementById('visibility');
    const moonPhase = document.getElementById('moon-phase');

    // Update weather icon based on conditions
    const iconMap = {
      'Clear': '☀️',
      'Partly Cloudy': '⛅',
      'Cloudy': '☁️',
      'Overcast': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️'
    };

    weatherIcon.textContent = iconMap[this.weather.main] || '🌤️';
    weatherMain.textContent = `${this.weather.main} - ${this.weather.temperature}°C`;
    weatherDesc.textContent = this.weather.description;
    cloudCover.textContent = `${this.weather.cloudCover}%`;
    visibility.textContent = `${this.weather.visibility} km`;
   
    // Calculate moon phase (simplified)
    const moonPhaseValue = this.calculateMoonPhase();
    moonPhase.textContent = moonPhaseValue;
  }

  calculateMoonPhase() {
    const now = new Date();
    const daysSinceNewMoon = (now.getTime() / (1000 * 60 * 60 * 24)) % 29.53;
   
    if (daysSinceNewMoon < 1.85) return 'New Moon';
    if (daysSinceNewMoon < 5.54) return 'Waxing Crescent';
    if (daysSinceNewMoon < 9.23) return 'First Quarter';
    if (daysSinceNewMoon < 12.92) return 'Waxing Gibbous';
    if (daysSinceNewMoon < 16.61) return 'Full Moon';
    if (daysSinceNewMoon < 20.30) return 'Waning Gibbous';
    if (daysSinceNewMoon < 23.99) return 'Last Quarter';
    return 'Waning Crescent';
  }

  async loadMeteorIntensity() {
    try {
      // Get current meteor shower data
      const currentShower = this.getCurrentMeteorShower();
      this.meteorData = currentShower;
     
      // Calculate intensity based on various factors
      const intensity = this.calculateMeteorIntensity();
     
      this.updateIntensityDisplay(intensity);
    } catch (error) {
      console.error('Meteor intensity calculation failed:', error);
    }
  }

  getCurrentMeteorShower() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
   
    // Simplified meteor shower calendar
    const showers = [
      { name: 'Quadrantids', peak: { month: 1, day: 4 }, zhr: 110, bestTime: 'Early morning' },
      { name: 'Lyrids', peak: { month: 4, day: 22 }, zhr: 18, bestTime: 'Late night' },
      { name: 'Perseids', peak: { month: 8, day: 12 }, zhr: 100, bestTime: 'After midnight' },
      { name: 'Orionids', peak: { month: 10, day: 20 }, zhr: 20, bestTime: 'After midnight' },
      { name: 'Leonids', peak: { month: 11, day: 17 }, zhr: 15, bestTime: 'Late night' },
      { name: 'Geminids', peak: { month: 12, day: 14 }, zhr: 120, bestTime: 'Evening to dawn' }
    ];

    // Find closest shower
    let closestShower = showers[0];
    let minDays = 365;

    for (const shower of showers) {
      const showerDate = new Date(now.getFullYear(), shower.peak.month - 1, shower.peak.day);
      const daysDiff = Math.abs((showerDate - now) / (1000 * 60 * 60 * 24));
     
      if (daysDiff < minDays) {
        minDays = daysDiff;
        closestShower = shower;
      }
    }

    return closestShower;
  }

  calculateMeteorIntensity() {
    if (!this.weather || !this.meteorData) return 0;

    let intensity = 0;
   
    // Base intensity from ZHR
    intensity += (this.meteorData.zhr / 120) * 40; // Max 40 points from ZHR
   
    // Weather factors
    if (this.weather.cloudCover < 20) intensity += 30; // Clear sky
    else if (this.weather.cloudCover < 50) intensity += 20; // Partly cloudy
    else if (this.weather.cloudCover < 80) intensity += 10; // Cloudy
    // Overcast gets 0 points
   
    // Visibility factor
    if (this.weather.visibility > 15) intensity += 20;
    else if (this.weather.visibility > 10) intensity += 15;
    else if (this.weather.visibility > 5) intensity += 10;
   
    // Moon phase factor (simplified)
    const moonPhase = document.getElementById('moon-phase').textContent;
    if (moonPhase === 'New Moon') intensity += 10;
    else if (moonPhase === 'Waning Crescent' || moonPhase === 'Waxing Crescent') intensity += 5;
   
    return Math.min(100, Math.max(0, intensity));
  }

  updateIntensityDisplay(intensity) {
    const intensityFill = document.getElementById('intensity-fill');
    const intensityLabel = document.getElementById('intensity-label');
    const zhrRate = document.getElementById('zhr-rate');
    const peakTime = document.getElementById('peak-time');
    const bestViewing = document.getElementById('best-viewing');

    // Animate intensity bar
    intensityFill.style.width = `${intensity}%`;
   
    // Update labels
    if (intensity >= 80) intensityLabel.textContent = 'Excellent Viewing Conditions!';
    else if (intensity >= 60) intensityLabel.textContent = 'Good Viewing Conditions';
    else if (intensity >= 40) intensityLabel.textContent = 'Fair Viewing Conditions';
    else if (intensity >= 20) intensityLabel.textContent = 'Poor Viewing Conditions';
    else intensityLabel.textContent = 'Very Poor Viewing Conditions';

    if (this.meteorData) {
      zhrRate.textContent = `${this.meteorData.zhr} meteors/hour`;
      peakTime.textContent = this.meteorData.bestTime;
      bestViewing.textContent = this.getBestViewingTime();
    }
  }

  getBestViewingTime() {
    const now = new Date();
    const hour = now.getHours();
   
    if (hour >= 22 || hour <= 4) return 'Now is a good time!';
    if (hour >= 20 || hour <= 6) return 'Good viewing time';
    return 'Wait until after sunset';
  }

  generateRecommendations() {
    const recommendations = document.getElementById('recommendations');
    const recs = [];

    if (this.weather) {
      if (this.weather.cloudCover > 80) {
        recs.push({ icon: '☁️', text: 'Heavy cloud cover detected. Wait for clearer skies.' });
      } else if (this.weather.cloudCover < 30) {
        recs.push({ icon: '⭐', text: 'Clear skies! Perfect conditions for meteor watching.' });
      }

      if (this.weather.visibility < 10) {
        recs.push({ icon: '🌫️', text: 'Low visibility due to weather conditions.' });
      }
    }

    if (this.meteorData) {
      const intensity = this.calculateMeteorIntensity();
      if (intensity > 70) {
        recs.push({ icon: '🌠', text: `High meteor activity expected! ${this.meteorData.name} shower is active.` });
      } else if (intensity < 30) {
        recs.push({ icon: '⏰', text: 'Low meteor activity. Consider waiting for better conditions.' });
      }
    }

    const now = new Date();
    const hour = now.getHours();
    if (hour < 20 && hour > 6) {
      recs.push({ icon: '🌅', text: 'Best viewing is after sunset. Wait for darker skies.' });
    }

    if (recs.length === 0) {
      recs.push({ icon: '🔍', text: 'Conditions are moderate. Check back later for updates.' });
    }

    recommendations.innerHTML = recs.map(rec => `
      <div class="recommendation-item">
        <div class="rec-icon">${rec.icon}</div>
        <div class="rec-text">${rec.text}</div>
      </div>
    `).join('');
  }

  async loadAllData() {
    if (this.location) {
      await this.loadWeatherData();
      await this.loadMeteorIntensity();
      this.generateRecommendations();
    }
  }

  testNotification() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🌠 Aureo Meteor Alert', {
          body: 'Test notification: Perfect conditions for meteor watching!',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌠</text></svg>'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.testNotification();
          }
        });
      }
    }
  }

  enableNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.startNotificationService();
          alert('🔔 Notifications enabled! You\'ll receive alerts for optimal meteor viewing conditions.');
        } else {
          alert('❌ Notifications blocked. Please enable them in your browser settings.');
        }
      });
    } else {
      alert('❌ This browser doesn\'t support notifications.');
    }
  }

  startNotificationService() {
    // Check conditions every 30 minutes
    setInterval(() => {
      this.checkNotificationConditions();
    }, 30 * 60 * 1000);
  }

  checkNotificationConditions() {
    if (!this.notificationSettings.weatherAlerts &&
        !this.notificationSettings.peakAlerts &&
        !this.notificationSettings.intensityAlerts) {
      return;
    }

    const intensity = this.calculateMeteorIntensity();
    const now = new Date();
    const hour = now.getHours();

    // Weather-based alerts
    if (this.notificationSettings.weatherAlerts && this.weather) {
      if (this.weather.cloudCover < 30 && this.weather.visibility > 15) {
        this.sendNotification('🌤️ Clear Skies Alert', 'Perfect weather conditions for meteor watching!');
      }
    }

    // Peak time alerts
    if (this.notificationSettings.peakAlerts) {
      if (hour >= 22 || hour <= 4) {
        this.sendNotification('🌠 Peak Viewing Time', 'Optimal time for meteor observation!');
      }
    }

    // High intensity alerts
    if (this.notificationSettings.intensityAlerts && intensity > 80) {
      this.sendNotification('🌠 High Meteor Activity', 'Excellent conditions detected! Get outside now!');
    }
  }

  sendNotification(title, body) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌠</text></svg>'
      });
    }
  }

  showLocationError() {
    const recommendations = document.getElementById('recommendations');
    recommendations.innerHTML = `
      <div class="recommendation-item">
        <div class="rec-icon">📍</div>
        <div class="rec-text">Location access denied. Enable location services for personalized alerts.</div>
      </div>
    `;
  }

  loadSettings() {
    const saved = localStorage.getItem('aureoNotificationSettings');
    if (saved) {
      this.notificationSettings = JSON.parse(saved);
     
      document.getElementById('weather-alerts').checked = this.notificationSettings.weatherAlerts;
      document.getElementById('peak-alerts').checked = this.notificationSettings.peakAlerts;
      document.getElementById('intensity-alerts').checked = this.notificationSettings.intensityAlerts;
    }
  }

  saveSettings() {
    localStorage.setItem('aureoNotificationSettings', JSON.stringify(this.notificationSettings));
  }
}

// Initialize notification system
let notificationSystem = null;

function openNotificationHub() {
  if (!notificationSystem) {
    notificationSystem = new SmartNotifications();
  }
  notificationSystem.open();
}

// ---------- ENHANCED METEOR SHOWER MAP & ALERT SYSTEM ----------
class MeteorMapAlertSystem {
  constructor() {
    this.location = null;
    this.activeShowers = [];
    this.alertSettings = this.loadAlertSettings();
    this.alertHistory = this.loadAlertHistory();
    this.updateInterval = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.detectLocation();
    this.loadActiveShowers();
    this.startMonitoring();
  }

  setupEventListeners() {
    // Refresh alerts button
    document.getElementById('refresh-location-alerts').addEventListener('click', () => {
      this.refreshAlerts();
    });

    // Map controls
    document.getElementById('map-type').addEventListener('change', (e) => {
      this.changeMapType(e.target.value);
    });

    document.getElementById('time-filter').addEventListener('change', (e) => {
      this.changeTimeFilter(e.target.value);
    });

    document.getElementById('center-location').addEventListener('click', () => {
      this.centerOnLocation();
    });

    document.getElementById('fullscreen-map').addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Alert settings
    const checkboxes = document.querySelectorAll('.setting-option input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.saveAlertSettings();
        this.checkAlertConditions();
      });
    });
  }

  async detectLocation() {
    try {
      const position = await this.getCurrentPosition();
      this.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      this.addToHistory('Location detected successfully', 'Location');
      this.updateLocationDisplay();
    } catch (error) {
      console.error('Location detection failed:', error);
      this.location = { latitude: 40.7128, longitude: -74.0060 }; // Default to NYC
      this.addToHistory('Using default location (NYC)', 'System');
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  async loadActiveShowers() {
    try {
      // Get current meteor shower data
      const cache = localStorage.getItem("meteorData");
      if (cache) {
        const { data } = JSON.parse(cache);
        this.activeShowers = this.filterActiveShowers(data);
        this.updateShowerList();
        this.updateAlertMetrics();
        this.checkAlertConditions();
      } else {
        // Load fresh data
        await fetchMeteorData();
        this.loadActiveShowers();
      }
    } catch (error) {
      console.error('Failed to load active showers:', error);
      this.addToHistory('Failed to load meteor shower data', 'Error');
    }
  }

  filterActiveShowers(showers) {
    const now = new Date();
    // Consider a shower "active" if its peak is within the last 7 days or next 30 days
    return showers
      .filter(shower => {
        const peak = new Date(shower.peak || shower.peakDate || shower.date || 0);
        if (isNaN(peak)) return false;
        const diffDays = (peak - now) / (1000 * 60 * 60 * 24);
        return diffDays >= -7 && diffDays <= 30;
      })
      .sort((a, b) => new Date(a.peak || a.peakDate) - new Date(b.peak || b.peakDate));
  }

  updateShowerList() {
    const showerList = document.getElementById('shower-list');
   
    if (this.activeShowers.length === 0) {
      showerList.innerHTML = '<div class="shower-item loading">No active meteor showers at this time</div>';
      return;
    }

    showerList.innerHTML = this.activeShowers.slice(0, 5).map(shower => `
      <div class="shower-item">
        <div class="shower-name">${shower.name}</div>
        <div class="shower-details">
          Peak: ${new Date(shower.peak || shower.peakDate).toLocaleDateString()}<br>
          ZHR: ${shower.zhr} meteors/hour<br>
          Origin: ${shower.origin}
        </div>
        <div class="shower-intensity">${this.getIntensityLevel(shower.zhr)}</div>
      </div>
    `).join('');
  }

  getIntensityLevel(zhr) {
    if (zhr >= 100) return 'Very High';
    if (zhr >= 50) return 'High';
    if (zhr >= 20) return 'Medium';
    if (zhr >= 10) return 'Low';
    return 'Very Low';
  }

  updateAlertMetrics() {
    const visibilityScore = this.calculateVisibilityScore();
    const nextPeak = this.getNextPeak();
   
    document.getElementById('visibility-score-alert').textContent = `${visibilityScore}/100`;
    document.getElementById('active-showers').textContent = this.activeShowers.length;
    document.getElementById('next-peak').textContent = nextPeak;
  }

  calculateVisibilityScore() {
    let score = 100;
   
    // Moon phase impact (simplified)
    const moonPhase = this.getMoonPhase();
    if (moonPhase === 'Full Moon') score -= 40;
    else if (moonPhase === 'New Moon') score += 20;
   
    // Weather impact (simplified)
    const weather = this.getWeatherConditions();
    if (weather.cloudCover > 70) score -= 30;
    else if (weather.cloudCover < 30) score += 10;
   
    // Time of day impact
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 18) score -= 50;
    else if (hour >= 22 || hour <= 4) score += 20;
   
    return Math.max(0, Math.min(100, score));
  }

  getMoonPhase() {
    // Simplified moon phase calculation
    const now = new Date();
    const knownNewMoon = new Date('2024-01-11T11:57:00Z');
    const lunarCycle = 29.53059;
    const daysSinceNewMoon = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentCycle = ((daysSinceNewMoon % lunarCycle) + lunarCycle) % lunarCycle;
   
    if (currentCycle < 1.84566) return 'New Moon';
    if (currentCycle < 5.53699) return 'Waxing Crescent';
    if (currentCycle < 9.22831) return 'First Quarter';
    if (currentCycle < 12.91963) return 'Waxing Gibbous';
    if (currentCycle < 16.61096) return 'Full Moon';
    if (currentCycle < 20.30228) return 'Waning Gibbous';
    if (currentCycle < 23.99361) return 'Last Quarter';
    return 'Waning Crescent';
  }

  getWeatherConditions() {
    // Simplified weather data (would integrate with real weather API)
    return {
      cloudCover: Math.floor(Math.random() * 100),
      visibility: Math.floor(Math.random() * 20) + 5,
      condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast'][Math.floor(Math.random() * 4)]
    };
  }

  getNextPeak() {
    if (this.activeShowers.length === 0) return 'None';
   
    const now = new Date();
    const nextShower = this.activeShowers.find(shower => new Date(shower.peak || shower.peakDate) > now);
   
    if (nextShower) {
      const peakDate = new Date(nextShower.peak || nextShower.peakDate);
      const daysUntil = Math.ceil((peakDate - now) / (1000 * 60 * 60 * 24));
      return `${nextShower.name} (${daysUntil}d)`;
    }
   
    return 'None this month';
  }

  checkAlertConditions() {
    const alerts = [];
   
    // Check moon phase alerts
    if (this.alertSettings.newMoonAlert && this.getMoonPhase() === 'New Moon') {
      alerts.push({
        type: 'Moon',
        message: 'New Moon detected - Excellent viewing conditions!',
        priority: 'high'
      });
    }
   
    // Check weather alerts
    const weather = this.getWeatherConditions();
    if (this.alertSettings.clearSkyAlert && weather.cloudCover < 20) {
      alerts.push({
        type: 'Weather',
        message: 'Clear skies detected - Perfect for meteor watching!',
        priority: 'high'
      });
    }
   
    // Check time alerts
    const hour = new Date().getHours();
    if (this.alertSettings.peakTimeAlert && (hour >= 22 || hour <= 4)) {
      alerts.push({
        type: 'Time',
        message: 'Peak viewing hours - Get outside now!',
        priority: 'medium'
      });
    }
   
    // Check active showers
    if (this.activeShowers.length > 0) {
      const bestShower = this.activeShowers[0];
      alerts.push({
        type: 'Shower',
        message: `${bestShower.name} is active with ${bestShower.zhr} meteors/hour`,
        priority: 'high'
      });
    }
   
    this.processAlerts(alerts);
  }

  processAlerts(alerts) {
    if (alerts.length === 0) {
      this.updateAlertBox('No active alerts at this time', 'normal');
      return;
    }
   
    const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high');
    const mediumPriorityAlerts = alerts.filter(alert => alert.priority === 'medium');
   
    if (highPriorityAlerts.length > 0) {
      const alert = highPriorityAlerts[0];
      this.updateAlertBox(alert.message, 'good');
      this.addToHistory(alert.message, alert.type);
    } else if (mediumPriorityAlerts.length > 0) {
      const alert = mediumPriorityAlerts[0];
      this.updateAlertBox(alert.message, 'warning');
      this.addToHistory(alert.message, alert.type);
    }
  }

  updateAlertBox(message, type) {
    const alertBox = document.getElementById('alert-box');
    const alertDetails = document.getElementById('alert-details');
   
    alertBox.textContent = message;
    alertBox.className = `alert-box alert-${type}`;
   
    if (type !== 'normal') {
      alertDetails.style.display = 'block';
    } else {
      alertDetails.style.display = 'none';
    }
  }

  updateLocationDisplay() {
    if (this.location) {
      this.addToHistory(`Location: ${this.location.latitude.toFixed(4)}, ${this.location.longitude.toFixed(4)}`, 'Location');
    }
  }

  changeMapType(type) {
    const iframe = document.getElementById('meteor-map');
    const baseUrl = 'https://www.meteorshowers.org/';
   
    switch (type) {
      case 'meteor':
        iframe.src = baseUrl;
        break;
      case 'sky':
        iframe.src = 'https://stellarium-web.org/';
        break;
      case 'radiant':
        iframe.src = baseUrl + '?view=radiant';
        break;
      case 'weather':
        iframe.src = 'https://www.windy.com/';
        break;
    }
   
    this.addToHistory(`Map type changed to ${type}`, 'Map');
  }

  changeTimeFilter(filter) {
    // This would integrate with the map to show different time periods
    this.addToHistory(`Time filter changed to ${filter}`, 'Map');
  }

  centerOnLocation() {
    if (this.location) {
      // This would center the map on user's location
      this.addToHistory('Map centered on your location', 'Map');
    } else {
      this.addToHistory('Location not available for centering', 'Error');
    }
  }

  toggleFullscreen() {
    const mapBox = document.querySelector('.map-box');
    if (!document.fullscreenElement) {
      mapBox.requestFullscreen().then(() => {
        this.addToHistory('Map entered fullscreen mode', 'Map');
      });
    } else {
      document.exitFullscreen().then(() => {
        this.addToHistory('Map exited fullscreen mode', 'Map');
      });
    }
  }

  refreshAlerts() {
    const refreshBtn = document.getElementById('refresh-location-alerts');
    refreshBtn.style.transform = 'scale(0.95)';
   
    setTimeout(async () => {
      refreshBtn.style.transform = '';
      await this.detectLocation();
      await this.loadActiveShowers();
      this.addToHistory('Alerts refreshed manually', 'System');
    }, 150);
  }

  startMonitoring() {
    // Check conditions every 5 minutes
    this.updateInterval = setInterval(() => {
      this.checkAlertConditions();
    }, 5 * 60 * 1000);
  }

  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  addToHistory(message, type) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
   
    this.alertHistory.unshift({
      time: timeString,
      message: message,
      type: type
    });
   
    // Keep only last 20 entries
    this.alertHistory = this.alertHistory.slice(0, 20);
   
    this.updateAlertHistory();
    this.saveAlertHistory();
  }

  updateAlertHistory() {
    const historyContainer = document.getElementById('alert-history');
    historyContainer.innerHTML = this.alertHistory.map(entry => `
      <div class="history-item">
        <div class="history-time">${entry.time}</div>
        <div class="history-message">${entry.message}</div>
        <div class="history-type">${entry.type}</div>
      </div>
    `).join('');
  }

  loadAlertSettings() {
    const defaultSettings = {
      newMoonAlert: true,
      crescentAlert: true,
      quarterAlert: false,
      clearSkyAlert: true,
      lowCloudAlert: true,
      visibilityAlert: true,
      peakTimeAlert: true,
      dawnAlert: true,
      weekendAlert: false
    };
   
    const saved = localStorage.getItem('meteorAlertSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  }

  saveAlertSettings() {
    const settings = {};
    const checkboxes = document.querySelectorAll('.setting-option input[type="checkbox"]');
   
    checkboxes.forEach(checkbox => {
      settings[checkbox.id.replace('-alert', 'Alert')] = checkbox.checked;
    });
   
    localStorage.setItem('meteorAlertSettings', JSON.stringify(settings));
    this.alertSettings = { ...this.alertSettings, ...settings };
  }

  loadAlertHistory() {
    const saved = localStorage.getItem('meteorAlertHistory');
    return saved ? JSON.parse(saved) : [{
      time: 'Just now',
      message: 'System initialized - monitoring conditions',
      type: 'System'
    }];
  }

  saveAlertHistory() {
    localStorage.setItem('meteorAlertHistory', JSON.stringify(this.alertHistory));
  }
}

// Initialize the enhanced map and alert system
let meteorMapAlertSystem = null;

document.addEventListener('DOMContentLoaded', () => {
  meteorMapAlertSystem = new MeteorMapAlertSystem();
});

// ---------- LIVE VISIBILITY STATS SYSTEM ----------
class LiveVisibilityStats {
  constructor() {
    this.modal = document.getElementById('live-stats-modal');
    this.location = null;
    this.moonData = null;
    this.weatherData = null;
    this.updateInterval = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.detectLocation();
  }

  setupEventListeners() {
    document.getElementById('close-live-stats').addEventListener('click', () => this.close());
    document.getElementById('refresh-stats').addEventListener('click', () => this.refreshData());
   
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display !== 'none') {
        this.close();
      }
    });
  }

  async open() {
    this.modal.style.display = 'flex';
    await this.loadAllData();
    this.startRealTimeUpdates();
  }

  close() {
    this.modal.style.display = 'none';
    this.stopRealTimeUpdates();
  }

  async detectLocation() {
    try {
      const position = await this.getCurrentPosition();
      this.location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      console.error('Location detection failed:', error);
      // Use default location (New York) for demo
      this.location = { latitude: 40.7128, longitude: -74.0060 };
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  async loadAllData() {
    await this.loadMoonData();
    await this.loadWeatherData();
    this.updateDisplay();
    this.generateRecommendations();
  }

  async loadMoonData() {
    try {
      // Calculate moon phase and brightness
      const now = new Date();
      const moonPhase = this.calculateMoonPhase(now);
      const moonBrightness = this.calculateMoonBrightness(moonPhase.illumination);
      const moonAge = this.calculateMoonAge(now);
     
      this.moonData = {
        phase: moonPhase.name,
        illumination: moonPhase.illumination,
        brightness: moonBrightness,
        age: moonAge,
        impact: this.calculateMoonImpact(moonPhase.illumination)
      };
    } catch (error) {
      console.error('Moon data calculation failed:', error);
      this.moonData = this.getDefaultMoonData();
    }
  }

  calculateMoonPhase(date) {
    // Simplified moon phase calculation
    const knownNewMoon = new Date('2024-01-11T11:57:00Z');
    const lunarCycle = 29.53059; // days
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentCycle = ((daysSinceNewMoon % lunarCycle) + lunarCycle) % lunarCycle;
   
    let phase, illumination;
   
    if (currentCycle < 1.84566) {
      phase = 'New Moon';
      illumination = 0;
    } else if (currentCycle < 5.53699) {
      phase = 'Waxing Crescent';
      illumination = (currentCycle - 1.84566) / 3.69133 * 25;
    } else if (currentCycle < 9.22831) {
      phase = 'First Quarter';
      illumination = 25 + (currentCycle - 5.53699) / 3.69132 * 25;
    } else if (currentCycle < 12.91963) {
      phase = 'Waxing Gibbous';
      illumination = 50 + (currentCycle - 9.22831) / 3.69132 * 25;
    } else if (currentCycle < 16.61096) {
      phase = 'Full Moon';
      illumination = 75 + (currentCycle - 12.91963) / 3.69133 * 25;
    } else if (currentCycle < 20.30228) {
      phase = 'Waning Gibbous';
      illumination = 100 - (currentCycle - 16.61096) / 3.69132 * 25;
    } else if (currentCycle < 23.99361) {
      phase = 'Last Quarter';
      illumination = 75 - (currentCycle - 20.30228) / 3.69133 * 25;
    } else {
      phase = 'Waning Crescent';
      illumination = 50 - (currentCycle - 23.99361) / 5.53699 * 25;
    }
   
    return { name: phase, illumination: Math.max(0, Math.min(100, illumination)) };
  }

  calculateMoonBrightness(illumination) {
    // Convert illumination percentage to magnitude
    const magnitude = -12.74 + 0.026 * illumination + 4e-9 * Math.pow(illumination, 4);
    return {
      magnitude: magnitude.toFixed(2),
      description: this.getBrightnessDescription(illumination)
    };
  }

  getBrightnessDescription(illumination) {
    if (illumination < 5) return 'Very Dark';
    if (illumination < 25) return 'Dark';
    if (illumination < 50) return 'Moderate';
    if (illumination < 75) return 'Bright';
    return 'Very Bright';
  }

  calculateMoonAge(date) {
    const knownNewMoon = new Date('2024-01-11T11:57:00Z');
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const age = ((daysSinceNewMoon % 29.53059) + 29.53059) % 29.53059;
    return Math.round(age);
  }

  calculateMoonImpact(illumination) {
    if (illumination < 10) {
      return {
        level: 'Minimal',
        description: 'Moon has little impact on meteor visibility. Excellent conditions!'
      };
    } else if (illumination < 30) {
      return {
        level: 'Low',
        description: 'Moon provides some light pollution but meteors should still be visible.'
      };
    } else if (illumination < 60) {
      return {
        level: 'Moderate',
        description: 'Moon brightness may wash out fainter meteors. Look for brighter ones.'
      };
    } else if (illumination < 90) {
      return {
        level: 'High',
        description: 'Bright moon significantly reduces meteor visibility. Only bright meteors visible.'
      };
    } else {
      return {
        level: 'Very High',
        description: 'Full moon creates severe light pollution. Very poor meteor viewing conditions.'
      };
    }
  }

  async loadWeatherData() {
    if (!this.location) return;

    try {
      // Try to get real weather data
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${this.location.latitude}&lon=${this.location.longitude}&appid=demo&units=metric`);
     
      if (response.ok) {
        const data = await response.json();
        this.weatherData = {
          cloudCover: data.clouds.all,
          visibility: data.visibility / 1000, // Convert to km
          condition: data.weather[0].main,
          description: data.weather[0].description,
          temperature: data.main.temp
        };
      } else {
        throw new Error('Weather API failed');
      }
    } catch (error) {
      console.error('Weather API failed:', error);
      this.weatherData = this.generateMockWeather();
    }
  }

  generateMockWeather() {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Overcast'];
    const descriptions = ['Clear sky', 'Few clouds', 'Scattered clouds', 'Broken clouds'];
    const randomIndex = Math.floor(Math.random() * conditions.length);
   
    return {
      cloudCover: Math.floor(Math.random() * 100),
      visibility: Math.floor(Math.random() * 20) + 5,
      condition: conditions[randomIndex],
      description: descriptions[randomIndex],
      temperature: Math.floor(Math.random() * 30) + 10
    };
  }

  updateDisplay() {
    this.updateOverview();
    this.updateMoonDisplay();
    this.updateCloudDisplay();
    this.updateViewingHours();
    this.updateLastUpdated();
  }

  updateOverview() {
    if (this.moonData) {
      document.getElementById('moon-phase-display').textContent = this.moonData.phase;
    }
   
    if (this.weatherData) {
      document.getElementById('cloud-cover-display').textContent = `${this.weatherData.cloudCover}%`;
    }
   
    const visibilityScore = this.calculateVisibilityScore();
    document.getElementById('visibility-score').textContent = `${visibilityScore}/100`;
  }

  updateMoonDisplay() {
    if (!this.moonData) return;

    document.getElementById('moon-phase-name').textContent = this.moonData.phase;
    document.getElementById('moon-brightness').textContent =
      `Magnitude: ${this.moonData.brightness.magnitude} (${this.moonData.brightness.description})`;
    document.getElementById('moon-age').textContent = `Age: ${this.moonData.age} days`;
   
    document.getElementById('moon-impact-level').textContent = this.moonData.impact.level;
    document.getElementById('moon-impact-desc').textContent = this.moonData.impact.description;
   
    // Update moon phase circle
    const illumination = document.getElementById('moon-illumination');
    illumination.style.clipPath = `polygon(0 0, ${this.moonData.illumination}% 0, ${this.moonData.illumination}% 100%, 0 100%)`;
  }

  updateCloudDisplay() {
    if (!this.weatherData) return;

    document.getElementById('cloud-percentage').textContent = `${this.weatherData.cloudCover}%`;
    document.getElementById('cloud-condition').textContent = this.weatherData.condition;
    document.getElementById('cloud-forecast').textContent = this.weatherData.description;
    document.getElementById('visibility-distance').textContent = `Visibility: ${this.weatherData.visibility} km`;
   
    // Update cloud cover bar
    const cloudFill = document.getElementById('cloud-fill');
    cloudFill.style.width = `${this.weatherData.cloudCover}%`;
  }

  updateViewingHours() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
   
    document.getElementById('current-time').textContent = currentTime;
   
    // Calculate optimal viewing times
    const sunset = this.calculateSunset(now);
    const sunrise = this.calculateSunrise(now);
    const bestStart = this.calculateBestStartTime(sunset);
    const peakHours = this.calculatePeakHours(sunset, sunrise);
   
    document.getElementById('sunset-time').textContent = sunset.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    document.getElementById('best-start-time').textContent = bestStart.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    document.getElementById('peak-hours').textContent = peakHours;
    document.getElementById('sunrise-time').textContent = sunrise.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
   
    // Update viewing status
    const status = this.getViewingStatus(now, sunset, sunrise);
    document.getElementById('viewing-status').textContent = status;
  }

  calculateSunset(date) {
    // Simplified sunset calculation (would need more complex algorithm for accuracy)
    const sunset = new Date(date);
    sunset.setHours(18, 30, 0, 0); // 6:30 PM as default
    return sunset;
  }

  calculateSunrise(date) {
    // Simplified sunrise calculation
    const sunrise = new Date(date);
    sunrise.setDate(sunrise.getDate() + 1);
    sunrise.setHours(6, 30, 0, 0); // 6:30 AM next day
    return sunrise;
  }

  calculateBestStartTime(sunset) {
    const bestStart = new Date(sunset);
    bestStart.setHours(bestStart.getHours() + 2); // 2 hours after sunset
    return bestStart;
  }

  calculatePeakHours(sunset, sunrise) {
    const peakStart = new Date(sunset);
    peakStart.setHours(peakStart.getHours() + 4); // 4 hours after sunset
   
    const peakEnd = new Date(sunrise);
    peakEnd.setHours(peakEnd.getHours() - 2); // 2 hours before sunrise
   
    return `${peakStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${peakEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  getViewingStatus(now, sunset, sunrise) {
    if (now < sunset) {
      return 'Wait for sunset';
    } else if (now >= sunset && now < sunrise) {
      return 'Good viewing time!';
    } else {
      return 'Wait for tonight';
    }
  }

  calculateVisibilityScore() {
    let score = 100;
   
    // Moon impact
    if (this.moonData) {
      score -= this.moonData.illumination * 0.5; // Moon reduces score
    }
   
    // Cloud cover impact
    if (this.weatherData) {
      score -= this.weatherData.cloudCover * 0.3; // Clouds reduce score
    }
   
    // Time of day impact
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 6 && hour <= 18) {
      score -= 50; // Daytime
    }
   
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations() {
    const recommendations = [];
   
    if (this.moonData) {
      if (this.moonData.illumination > 80) {
        recommendations.push({
          icon: '🌕',
          text: 'Full moon creates bright conditions. Look for very bright meteors only.'
        });
      } else if (this.moonData.illumination < 20) {
        recommendations.push({
          icon: '🌑',
          text: 'Dark moon conditions are perfect for meteor watching!'
        });
      }
    }
   
    if (this.weatherData) {
      if (this.weatherData.cloudCover > 70) {
        recommendations.push({
          icon: '☁️',
          text: 'Heavy cloud cover will block meteor visibility. Wait for clearer skies.'
        });
      } else if (this.weatherData.cloudCover < 30) {
        recommendations.push({
          icon: '⭐',
          text: 'Clear skies provide excellent conditions for meteor observation.'
        });
      }
    }
   
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 6 && hour <= 18) {
      recommendations.push({
        icon: '🌅',
        text: 'It\'s daytime. Best meteor viewing is after sunset.'
      });
    } else if (hour >= 22 || hour <= 4) {
      recommendations.push({
        icon: '🌠',
        text: 'Perfect time for meteor watching! Get outside now.'
      });
    }
   
    const visibilityScore = this.calculateVisibilityScore();
    if (visibilityScore > 80) {
      recommendations.push({
        icon: '🎯',
        text: 'Excellent viewing conditions! High chance of seeing meteors.'
      });
    } else if (visibilityScore < 30) {
      recommendations.push({
        icon: '⏰',
        text: 'Poor viewing conditions. Consider waiting for better weather or time.'
      });
    }
   
    if (recommendations.length === 0) {
      recommendations.push({
        icon: '🔍',
        text: 'Moderate viewing conditions. Check back later for updates.'
      });
    }
   
    const recommendationsContainer = document.getElementById('live-recommendations');
    recommendationsContainer.innerHTML = recommendations.map(rec => `
      <div class="recommendation-item">
        <div class="rec-icon">${rec.icon}</div>
        <div class="rec-text">${rec.text}</div>
      </div>
    `).join('');
  }

  updateLastUpdated() {
    const now = new Date();
    document.getElementById('stats-last-updated').textContent = now.toLocaleTimeString();
  }

  async refreshData() {
    const refreshBtn = document.getElementById('refresh-stats');
    refreshBtn.style.transform = 'scale(0.95)';
   
    setTimeout(async () => {
      refreshBtn.style.transform = '';
      await this.loadAllData();
    }, 150);
  }

  startRealTimeUpdates() {
    // Update every 5 minutes
    this.updateInterval = setInterval(() => {
      this.loadAllData();
    }, 5 * 60 * 1000);
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  getDefaultMoonData() {
    return {
      phase: 'Waxing Gibbous',
      illumination: 65,
      brightness: { magnitude: '-11.2', description: 'Bright' },
      age: 12,
      impact: {
        level: 'Moderate',
        description: 'Moon brightness may wash out fainter meteors. Look for brighter ones.'
      }
    };
  }
}

// Initialize live stats system
let liveStatsSystem = null;

function openLiveStats() {
  if (!liveStatsSystem) {
    liveStatsSystem = new LiveVisibilityStats();
  }
  liveStatsSystem.open();
}

/* ================================
   🌌 FEATURE 3: LIVE METEOR DATA FEED
   ================================ */
async function fetchMeteorData() {
  const eventsSection = document.querySelector("#events .cards");
  eventsSection.innerHTML = `<div class="card gradient1 loading-card"><h4>Loading meteor data...</h4></div>`;

  // Show 4–5 popular showers using hardcoded data as requested
  const popular = getPopularShowers(5);
  if (popular && popular.length) {
    displayMeteorData(popular, 'Popular Showers');
    localStorage.setItem("meteorData", JSON.stringify({ data: popular, time: Date.now(), source: 'Popular' }));
    return;
  }

  // Check for cached data first
  const cached = localStorage.getItem("meteorData");
  if (cached) {
    const { data, time } = JSON.parse(cached);
    // Use cached data if it's less than 6 hours old (more frequent updates)
    if (Date.now() - time < 6 * 60 * 60 * 1000) {
      displayMeteorData(data);
      return;
    }
  }

  try {
    // Try multiple data sources in order of preference
    const dataSources = [
      {
        name: "IMO Meteor Shower Database",
        fetcher: fetchIMOData
      },
      {
        name: "NASA Astronomy API",
        fetcher: fetchNASAMeteorData
      },
      {
        name: "Meteor Shower API",
        fetcher: async () => {
          const response = await fetch("https://meteor-shower-api.vercel.app/api/showers", {
            timeout: 8000,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Aureo-Meteor-Observation/1.0'
            }
          });
          if (response.ok) {
            const rawData = await response.json();
            return parseMeteorShowerAPI(rawData);
          }
          return [];
        }
      }
    ];
   
    let data = null;
    let successfulAPI = null;
   
    for (const source of dataSources) {
      try {
        console.log(`Trying ${source.name}...`);
        data = await source.fetcher();
        if (data && data.length > 0) {
          successfulAPI = source.name;
          console.log(`Successfully fetched data from ${source.name}`);
          break;
        }
      } catch (e) {
        console.log(`${source.name} failed:`, e.message);
        continue;
      }
    }

    if (data && Array.isArray(data) && data.length > 0) {
      // Normalize and filter by upcoming peak date
      const normalized = data
        .map(s => ({
          ...s,
          peak: s.peak || s.peakDate || s.date || new Date().toISOString()
        }));
      let upcoming = normalized
        .filter(shower => {
          const d = new Date(shower.peak);
          return !isNaN(d) && d >= new Date();
        })
        .sort((a, b) => new Date(a.peak) - new Date(b.peak))
        .slice(0, 8); // Show next 8 showers
      // If no future events from APIs, fallback to curated set
      if (!upcoming || upcoming.length === 0) {
        upcoming = getCuratedUpcomingShowers();
        successfulAPI = successfulAPI || 'Curated Dataset';
      }
     
      displayMeteorData(upcoming, successfulAPI);
     
      // Cache results for 6 hours
      localStorage.setItem("meteorData", JSON.stringify({
        data: upcoming,
        time: Date.now(),
        source: successfulAPI
      }));
    } else {
      throw new Error("No valid data received from any API");
    }
  } catch (err) {
    console.error("All meteor data APIs failed:", err);
    displayFallbackData();
  }
}

// Curated dataset used as a reliable fallback when APIs have no future items
function getCuratedUpcomingShowers() {
  const now = new Date();
  const y = now.getFullYear();
  const candidates = [
    { name: 'Quadrantids', month: 1, day: 4, zhr: 110, parent: '2003 EH1', description: 'Sharp, short peak; strong Northern shower.' },
    { name: 'Lyrids', month: 4, day: 22, zhr: 18, parent: 'Comet Thatcher', description: 'Occasional fireballs, steady annual show.' },
    { name: 'Eta Aquariids', month: 5, day: 6, zhr: 50, parent: 'Comet Halley', description: 'Best before dawn; stronger in Southern hemisphere.' },
    { name: 'Perseids', month: 8, day: 12, zhr: 100, parent: 'Comet Swift–Tuttle', description: 'Most popular Northern shower; bright and numerous.' },
    { name: 'Orionids', month: 10, day: 21, zhr: 20, parent: 'Comet Halley', description: 'Fast meteors with persistent trains.' },
    { name: 'Leonids', month: 11, day: 17, zhr: 15, parent: 'Comet Tempel–Tuttle', description: 'Can produce storms in some years.' },
    { name: 'Geminids', month: 12, day: 14, zhr: 120, parent: '3200 Phaethon', description: 'Most reliable; many bright, medium-speed meteors.' },
    { name: 'Ursids', month: 12, day: 22, zhr: 10, parent: 'Comet Tuttle', description: 'Northern minor shower near the Little Dipper.' }
  ];
  const toISO = (year, m, d) => new Date(Date.UTC(year, m - 1, d, 6, 0, 0)).toISOString();
  const enriched = candidates.map(s => {
    // If peak date in current year already passed, use next year
    const thisYearPeak = new Date(Date.UTC(y, s.month - 1, s.day, 6, 0, 0));
    const peakDate = thisYearPeak < now ? new Date(Date.UTC(y + 1, s.month - 1, s.day, 6, 0, 0)) : thisYearPeak;
    return {
      name: s.name,
      peak: peakDate.toISOString(),
      zhr: s.zhr,
      parent: s.parent,
      description: s.description
    };
  });
  return enriched
    .filter(s => new Date(s.peak) >= now)
    .sort((a, b) => new Date(a.peak) - new Date(b.peak))
    .slice(0, 8);
}

// Fixed popular list: Perseids, Geminids, Quadrantids, Lyrids, Leonids (4–5 cards)
function getPopularShowers(limit = 5) {
  const now = new Date();
  const y = now.getFullYear();
  const toISO = (year, m, d) => new Date(Date.UTC(year, m - 1, d, 6, 0, 0)).toISOString();
  const base = [
    { name: 'Quadrantids', month: 1, day: 4, zhr: 110, parent: '2003 EH1' },
    { name: 'Lyrids', month: 4, day: 22, zhr: 18, parent: 'Comet Thatcher' },
    { name: 'Perseids', month: 8, day: 12, zhr: 100, parent: 'Comet Swift–Tuttle' },
    { name: 'Leonids', month: 11, day: 17, zhr: 15, parent: 'Comet Tempel–Tuttle' },
    { name: 'Geminids', month: 12, day: 14, zhr: 120, parent: '3200 Phaethon' }
  ].map(s => {
    const thisYearPeak = new Date(Date.UTC(y, s.month - 1, s.day, 6, 0, 0));
    const peak = thisYearPeak < now ? toISO(y + 1, s.month, s.day) : toISO(y, s.month, s.day);
    return { name: s.name, peak, zhr: s.zhr, parent: s.parent };
  });
  return base
    .filter(s => new Date(s.peak) >= now)
    .sort((a, b) => new Date(a.peak) - new Date(b.peak))
    .slice(0, limit);
}

// API Parser Functions
function parseNASAData(data) {
  // NASA NEO API doesn't directly provide meteor shower data
  // This is a placeholder for when NASA provides meteor shower endpoints
  return [];
}

function parseIMOData(data) {
  // IMO provides HTML calendar, would need scraping
  // For now, return empty array as this requires server-side processing
  return [];
}

function parseMeteorShowerAPI(data) {
  if (!Array.isArray(data)) return [];
 
  return data.map(shower => ({
    name: shower.name || 'Unknown Shower',
    peak: shower.peak || new Date().toISOString(),
    zhr: shower.zhr || 'Unknown',
    parent: shower.parent || 'Unknown',
    description: shower.description || '',
    radiant: shower.radiant || '',
    velocity: shower.velocity || ''
  }));
}

function parseAstronomyAPI(data) {
  if (!data.events || !Array.isArray(data.events)) return [];
 
  return data.events
    .filter(event => event.type === 'meteor_shower')
    .map(event => ({
      name: event.name || 'Unknown Shower',
      peak: event.date || new Date().toISOString(),
      zhr: event.zhr || 'Unknown',
      parent: event.parent || 'Unknown',
      description: event.description || '',
      radiant: event.radiant || '',
      velocity: event.velocity || ''
    }));
}

// Enhanced NASA API integration
async function fetchNASAMeteorData() {
  try {
    // Try NASA's Astronomy Picture of the Day for meteor-related content
    const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&count=10');
    if (response.ok) {
      const data = await response.json();
      // Filter for meteor-related content
      const meteorAPODs = data.filter(apod =>
        apod.title.toLowerCase().includes('meteor') ||
        apod.explanation.toLowerCase().includes('meteor')
      );
     
      if (meteorAPODs.length > 0) {
        return [{
          name: 'NASA Featured Meteor Event',
          peak: new Date().toISOString(),
          zhr: 'Special Event',
          parent: 'NASA',
          description: meteorAPODs[0].explanation.substring(0, 100) + '...',
          image: meteorAPODs[0].url
        }];
      }
    }
  } catch (error) {
    console.error('NASA API error:', error);
  }
  return [];
}

// IMO Data Scraper (simplified version)
async function fetchIMOData() {
  try {
    // This would typically require a CORS proxy or server-side implementation
    // For demo purposes, we'll use a mock IMO data structure
    const imoShowers = [
      {
        name: 'Quadrantids',
        peak: '2024-01-04T06:00:00Z',
        zhr: 110,
        parent: '2003 EH1',
        description: 'One of the most intense annual meteor showers',
        radiant: 'Bootes',
        velocity: '41 km/s'
      },
      {
        name: 'Lyrids',
        peak: '2024-04-22T18:00:00Z',
        zhr: 18,
        parent: 'Comet Thatcher',
        description: 'Known for producing bright meteors with persistent trains',
        radiant: 'Lyra',
        velocity: '49 km/s'
      },
      {
        name: 'Eta Aquariids',
        peak: '2024-05-06T09:00:00Z',
        zhr: 50,
        parent: 'Comet Halley',
        description: 'Best viewed from southern hemisphere',
        radiant: 'Aquarius',
        velocity: '66 km/s'
      },
      {
        name: 'Perseids',
        peak: '2024-08-13T07:00:00Z',
        zhr: 100,
        parent: 'Comet Swift-Tuttle',
        description: 'Most popular meteor shower of the year',
        radiant: 'Perseus',
        velocity: '59 km/s'
      },
      {
        name: 'Orionids',
        peak: '2024-10-21T23:00:00Z',
        zhr: 20,
        parent: 'Comet Halley',
        description: 'Fast meteors with persistent trains',
        radiant: 'Orion',
        velocity: '66 km/s'
      },
      {
        name: 'Leonids',
        peak: '2024-11-17T05:00:00Z',
        zhr: 15,
        parent: 'Comet Tempel-Tuttle',
        description: 'Famous for producing meteor storms',
        radiant: 'Leo',
        velocity: '71 km/s'
      },
      {
        name: 'Geminids',
        peak: '2024-12-14T19:00:00Z',
        zhr: 120,
        parent: 'Asteroid 3200 Phaethon',
        description: 'Most reliable meteor shower of the year',
        radiant: 'Gemini',
        velocity: '35 km/s'
      },
      {
        name: 'Ursids',
        peak: '2024-12-22T22:00:00Z',
        zhr: 10,
        parent: 'Comet Tuttle',
        description: 'Minor shower visible from northern hemisphere',
        radiant: 'Ursa Minor',
        velocity: '33 km/s'
      }
    ];
   
    return imoShowers;
  } catch (error) {
    console.error('IMO data error:', error);
    return [];
  }
}

function displayMeteorData(data, source = 'API') {
  const eventsSection = document.querySelector("#events .cards");
  eventsSection.innerHTML = "";
 
  // Add source indicator
  const sourceIndicator = document.createElement("div");
  sourceIndicator.className = "data-source-indicator";
  sourceIndicator.innerHTML = `<small>📡 Data source: ${source} | Last updated: ${new Date().toLocaleTimeString()}</small>`;
  eventsSection.appendChild(sourceIndicator);
 
  data.slice(0, 8).forEach((shower, index) => {
    const card = document.createElement("div");
    card.className = `card shower-card gradient${(index % 3) + 1}`;
   
    // Format peak date
    const peakDate = new Date(shower.peak || shower.peakDate);
    const formattedDate = peakDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
   
    // Calculate days until peak
    const now = new Date();
    const daysUntil = Math.ceil((peakDate - now) / (1000 * 60 * 60 * 24));
    const daysText = daysUntil > 0 ? `${daysUntil} days` : daysUntil === 0 ? 'Today!' : 'Past peak';
   
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(shower.name + ' meteor shower')}`;
    card.innerHTML = `
      <div class="shower-header">
        <h4>${shower.name || 'Unknown Shower'}</h4>
        <span class="chip days-until">${daysText}</span>
      </div>
      <div class="shower-meta">
        <span class="badge zhr-badge">ZHR ${shower.zhr || '—'}</span>
        <span class="badge origin-badge">${shower.parent || 'N/A'}</span>
        <span class="badge date-badge">${formattedDate}</span>
      </div>
      ${shower.image ? `<div class="shower-image"><img src="${shower.image}" alt="${shower.name}" loading="lazy"></div>` : ''}
      ${shower.description ? `<p class="shower-description">${shower.description}</p>` : ''}
      <div class="shower-cta">
        <a class="btn-ghost" href="${searchUrl}" target="_blank" rel="noopener">Learn more →</a>
      </div>
    `;
    eventsSection.appendChild(card);
  });

  // Add a featured image below the upcoming meteor showers
  const featured = data[0];
  if (featured) {
    const container = document.createElement('div');
    container.className = 'shower-featured-image card gradient2';
    container.innerHTML = `
      <div class="featured-caption"><strong>Featured:</strong> ${featured.name || 'Meteor Shower'}</div>
      <div class="featured-img loading"><span>Loading image…</span></div>
    `;
    eventsSection.appendChild(container);
    // Try to use existing image on the item, otherwise fetch from NASA Images
    const imgHolder = container.querySelector('.featured-img');
    if (featured.image) {
      imgHolder.classList.remove('loading');
      imgHolder.innerHTML = `<img src="${featured.image}" alt="${featured.name}" loading="lazy">`;
    } else {
      fetchNASAImageForQuery(`${featured.name} meteor shower`).then((url) => {
        if (url) {
          imgHolder.classList.remove('loading');
          imgHolder.innerHTML = `<img src="${url}" alt="${featured.name}" loading="lazy">`;
        } else {
          imgHolder.classList.remove('loading');
          imgHolder.innerHTML = `<div class="img-fallback">No image available.</div>`;
        }
      }).catch(() => {
        imgHolder.classList.remove('loading');
        imgHolder.innerHTML = `<div class="img-fallback">No image available.</div>`;
      });
    }
  }
}

// Helper: NASA Images API search returning a representative image URL
async function fetchNASAImageForQuery(query) {
  try {
    const api = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`;
    const res = await fetch(api);
    if (!res.ok) return '';
    const j = await res.json();
    const items = j.collection && Array.isArray(j.collection.items) ? j.collection.items : [];
    const first = items.find(it => Array.isArray(it.links) && it.links[0]?.href) || items[0];
    return first?.links?.[0]?.href || '';
  } catch {
    return '';
  }
}

function displayFallbackData() {
  const eventsSection = document.querySelector("#events .cards");
  const currentYear = new Date().getFullYear();
 
  eventsSection.innerHTML = `
    <div class="card gradient1">
      <h4>🌠 Perseids</h4>
      <p><strong>Peak:</strong> August 12-13, ${currentYear}<br/>
      <strong>ZHR:</strong> ~100 meteors/hour<br/>
      <strong>Origin:</strong> Comet Swift-Tuttle</p>
    </div>
    <div class="card gradient2">
      <h4>💫 Geminids</h4>
      <p><strong>Peak:</strong> December 13-14, ${currentYear}<br/>
      <strong>ZHR:</strong> ~120 meteors/hour<br/>
      <strong>Origin:</strong> Asteroid 3200 Phaethon</p>
    </div>
    <div class="card gradient3">
      <h4>⭐ Quadrantids</h4>
      <p><strong>Peak:</strong> January 3-4, ${currentYear + 1}<br/>
      <strong>ZHR:</strong> ~110 meteors/hour<br/>
      <strong>Origin:</strong> Asteroid 2003 EH1</p>
    </div>
    <div class="card gradient1">
      <h4>🌌 Leonids</h4>
      <p><strong>Peak:</strong> November 17-18, ${currentYear}<br/>
      <strong>ZHR:</strong> ~15 meteors/hour<br/>
      <strong>Origin:</strong> Comet Tempel-Tuttle</p>
    </div>
    <div class="card gradient2">
      <h4>✨ Lyrids</h4>
      <p><strong>Peak:</strong> April 21-22, ${currentYear + 1}<br/>
      <strong>ZHR:</strong> ~18 meteors/hour<br/>
      <strong>Origin:</strong> Comet Thatcher</p>
    </div>
    <div class="card gradient3">
      <h4>🌟 Orionids</h4>
      <p><strong>Peak:</strong> October 20-21, ${currentYear}<br/>
      <strong>ZHR:</strong> ~20 meteors/hour<br/>
      <strong>Origin:</strong> Comet Halley</p>
    </div>
  `;
}

// ---------- ENHANCED METEOR GUIDE CHATBOT ----------
class GuideChatbot {
  constructor() {
    this.logEl = document.getElementById('chat-log');
    this.inputEl = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
    this.quickBtns = document.querySelectorAll('.chat-quick');
    this.location = null;
    this.isTyping = false;
    // Enhanced knowledge base with fuzzy matching
    this.kb = this.buildEnhancedKnowledgeBase();
    this.init();
  }
  init() {
    if (!this.logEl) return;
    this.bindEvents();
    this.detectLocation();
  }
  bindEvents() {
    this.sendBtn?.addEventListener('click', () => this.handleSend());
    this.inputEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleSend(); });
    this.quickBtns.forEach(btn => btn.addEventListener('click', () => {
      this.inputEl.value = btn.getAttribute('data-prompt');
      this.handleSend();
    }));
  }
  buildEnhancedKnowledgeBase() {
    return {
      // Meteor basics
      'meteor_basics': {
        keywords: ['meteor', 'meteoroid', 'meteorite', 'shooting star', 'space rock', 'difference', 'what is'],
        questions: ['what is a meteor', 'meteor vs meteoroid', 'shooting star meaning', 'space rock types'],
        answer: 'A meteoroid is a small space rock floating in space. When it enters Earth\'s atmosphere and burns up, creating a streak of light, that\'s a meteor (or "shooting star"). If any pieces survive and hit the ground, those are meteorites! 🌠'
      },
      'meteor_shower': {
        keywords: ['meteor shower', 'shower', 'annual', 'predictable', 'debris', 'comet trail'],
        questions: ['what is a meteor shower', 'how do meteor showers work', 'why do meteor showers happen', 'annual meteor showers'],
        answer: 'Meteor showers happen when Earth passes through debris left behind by comets or asteroids. The debris burns up in our atmosphere, creating lots of meteors that seem to come from one point in the sky (the radiant). They\'re predictable and happen around the same time each year! ✨'
      },
      'radiant': {
        keywords: ['radiant', 'direction', 'where to look', 'point of origin', 'constellation'],
        questions: ['what is the radiant', 'where do meteors come from', 'which direction to look', 'radiant meaning'],
        answer: 'The radiant is the point in the sky where meteors appear to originate from. It\'s like perspective - meteors seem to come from one spot, but you should actually look about 45-60° away from the radiant for the best view! 🎯'
      },
      'zhr': {
        keywords: ['zhr', 'zenithal hourly rate', 'meteors per hour', 'rate', 'how many'],
        questions: ['what is zhr', 'how many meteors per hour', 'meteor shower rate', 'zenithal hourly rate'],
        answer: 'ZHR (Zenithal Hourly Rate) is the theoretical number of meteors you\'d see under perfect conditions - dark sky, radiant overhead, experienced observer. Real rates are usually lower due to light pollution, moon, and other factors. Think of it as the "best case scenario"! 📊'
      },
      'observing_tips': {
        keywords: ['how to watch', 'tips', 'observe', 'viewing', 'best way', 'technique'],
        questions: ['how to watch meteors', 'meteor observing tips', 'best way to see meteors', 'viewing techniques'],
        answer: 'Find a dark spot away from city lights, let your eyes adapt for 20-30 minutes, use a reclining chair, look about 45° from the radiant, avoid phone screens, and dress warmly! No telescope needed - just your eyes and patience. 🌙'
      },
      'best_time': {
        keywords: ['best time', 'when to watch', 'peak time', 'tonight', 'morning', 'evening'],
        questions: ['when is the best time to watch', 'what time tonight', 'morning vs evening', 'peak viewing time'],
        answer: 'Most meteor showers are best after midnight when the radiant is higher in the sky and your location faces Earth\'s direction of motion. Dark, moonless nights are ideal. Check the specific shower\'s peak dates for the best activity! 🌅'
      },
      'moon_impact': {
        keywords: ['moon', 'moonlight', 'bright', 'dark', 'phase', 'new moon', 'full moon'],
        questions: ['how does the moon affect meteors', 'full moon meteor watching', 'moon phase impact', 'bright moon'],
        answer: 'Bright moonlight washes out faint meteors, making them harder to see. Near new moon is perfect for meteor watching! Near full moon, you\'ll mainly see bright meteors. Try to shield your view from the moon if possible. 🌕'
      },
      'light_pollution': {
        keywords: ['light pollution', 'city lights', 'dark sky', 'bortle', 'urban', 'rural'],
        questions: ['how does light pollution affect meteors', 'city vs rural meteor watching', 'dark sky locations', 'bortle scale'],
        answer: 'City lights dramatically reduce the number of meteors you can see. For the best experience, find a dark sky location (Bortle 3-4 or darker). Even driving 30 minutes outside the city can make a huge difference! 🌃'
      },
      'famous_showers': {
        keywords: ['famous', 'popular', 'best', 'major', 'perseids', 'geminids', 'quadrantids'],
        questions: ['famous meteor showers', 'best meteor showers', 'major annual showers', 'perseids geminids'],
        answer: 'The most popular annual showers are: Perseids (Aug, ~100/hr), Geminids (Dec, ~120/hr), Quadrantids (Jan, ~110/hr), Lyrids (Apr, ~18/hr), and Leonids (Nov, ~15/hr). Each has its own peak dates and characteristics! 🌠'
      },
      'photography': {
        keywords: ['photograph', 'camera', 'photo', 'astrophotography', 'settings', 'tripod'],
        questions: ['how to photograph meteors', 'camera settings for meteors', 'meteor photography tips', 'astrophotography'],
        answer: 'Use a wide-angle lens, high ISO (1600-6400), 10-30 second exposures, continuous shooting on a tripod. Point about 45° away from the radiant to capture longer meteor trails. Patience is key! 📸'
      },
      'fireballs': {
        keywords: ['fireball', 'bolide', 'bright', 'explosion', 'fragment', 'rare'],
        questions: ['what is a fireball', 'bright meteor', 'bolide meaning', 'exploding meteor'],
        answer: 'A fireball is an exceptionally bright meteor - brighter than Venus! A bolide is a fireball that explodes or fragments in the atmosphere. These are rare but absolutely spectacular to witness! 💥'
      },
      'constellations': {
        keywords: ['constellation', 'stars', 'patterns', 'sky map', 'navigation', 'star patterns'],
        questions: ['what are constellations', 'star patterns', 'sky navigation', 'constellation names'],
        answer: 'Constellations are patterns of stars that humans have grouped together for navigation and storytelling. They help us find our way around the night sky and locate meteor shower radiants! Popular ones include Orion, Ursa Major, and Cassiopeia. ⭐'
      },
      'comets': {
        keywords: ['comet', 'comets', 'icy', 'tail', 'orbit', 'halley', 'swift-tuttle'],
        questions: ['what are comets', 'comet tails', 'famous comets', 'comet orbits'],
        answer: 'Comets are icy bodies that orbit the Sun, developing beautiful tails when they get close. Many meteor showers come from debris left by comets like Halley\'s Comet (Orionids) or Swift-Tuttle (Perseids). They\'re like cosmic snowballs! ☄️'
      },
      'planets': {
        keywords: ['planets', 'planet', 'mars', 'venus', 'jupiter', 'saturn', 'mercury'],
        questions: ['visible planets', 'planet watching', 'mars venus jupiter', 'planet observation'],
        answer: 'You can see several planets with the naked eye! Venus is the brightest "evening star," Mars appears reddish, Jupiter is large and bright, and Saturn has beautiful rings (visible with binoculars). They\'re great targets while meteor watching! 🪐'
      },
      'space_telescope': {
        keywords: ['telescope', 'binoculars', 'equipment', 'gear', 'magnification', 'optics'],
        questions: ['do I need a telescope for meteors', 'binoculars for astronomy', 'telescope recommendations', 'astronomy equipment'],
        answer: 'For meteors, you don\'t need a telescope - your eyes are perfect! But binoculars are great for viewing planets, star clusters, and the Moon. A telescope is wonderful for deep-sky objects, but meteors move too fast for telescopes. 👁️'
      }
    };
  }
  async handleSend() {
    const q = (this.inputEl.value || '').trim();
    if (!q || this.isTyping) return;
    this.append('user', q);
    this.inputEl.value = '';
    this.showTyping();
   
    try {
      const answer = await this.routeIntent(q);
      this.hideTyping();
      await this.typeMessage(answer);
    } catch (e) {
      this.hideTyping();
      await this.typeMessage('Sorry, I ran into an issue. Please try again.');
      console.error(e);
    }
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
  append(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    this.logEl.appendChild(div);
  }
 
  showTyping() {
    this.isTyping = true;
    const div = document.createElement('div');
    div.className = 'msg bot typing';
    div.innerHTML = '<span class="typing-dots">Thinking<span class="dots">...</span></span>';
    this.logEl.appendChild(div);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
 
  hideTyping() {
    this.isTyping = false;
    const typing = this.logEl.querySelector('.typing');
    if (typing) typing.remove();
  }
 
  async typeMessage(text) {
    const div = document.createElement('div');
    div.className = 'msg bot';
    this.logEl.appendChild(div);
   
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        div.textContent = text.substring(0, i + 1);
        i++;
        this.logEl.scrollTop = this.logEl.scrollHeight;
      } else {
        clearInterval(typeInterval);
      }
    }, 30); // Adjust speed as needed
  }
  async detectLocation() {
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, rej,{enableHighAccuracy:true,timeout:8000,maximumAge:300000}) : rej('no-geo'));
      this.location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch { this.location = null; }
  }
  async routeIntent(q) {
    const lower = q.toLowerCase();
   
    // Help/commands
    if (/^(help|commands|topics|what can you do)/.test(lower)) return this.answerHelp();
   
    // Enhanced fuzzy matching for knowledge base
    const bestMatch = this.findBestMatch(q);
    if (bestMatch) return bestMatch.answer;
   
    // Existing intents (kept for compatibility)
    if (/(upcoming|next|soon).*(shower|meteor)/.test(lower)) return this.answerUpcoming();
    if (/(best|good).*(time|when)/.test(lower) || /(tonight|peak)/.test(lower)) return this.answerBestTime();
    if (/(weather|cloud|visibility)/.test(lower)) return this.answerWeather();
    if (/(where|direction|radiant)/.test(lower)) return this.answerRadiant(q);
    if (/(moon|phase|brightness)/.test(lower)) return this.answerMoonImpact();
   
    // Space images & APOD
    if (/(apod|astronomy picture of the day)/.test(lower)) return this.answerAPOD();
    if (/(image|photo|picture|show me).*(of|\b)(.*)/.test(lower)) return this.answerImageSearch(q);
   
    // Generic definition fallback
    if (/(what is|who are|define|meaning|about)/.test(lower)) return this.answerDefinition(q);
   
    return this.answerFallback();
  }
 
  findBestMatch(query) {
    const lower = query.toLowerCase();
    let bestScore = 0;
    let bestMatch = null;
   
    for (const [key, topic] of Object.entries(this.kb)) {
      let score = 0;
     
      // Check keywords
      for (const keyword of topic.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
     
      // Check questions
      for (const question of topic.questions) {
        if (lower.includes(question.toLowerCase())) {
          score += 3;
        }
      }
     
      // Partial word matching
      const words = lower.split(/\s+/);
      for (const word of words) {
        for (const keyword of topic.keywords) {
          if (keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())) {
            score += 1;
          }
        }
      }
     
      if (score > bestScore) {
        bestScore = score;
        bestMatch = topic;
      }
    }
   
    return bestScore >= 2 ? bestMatch : null;
  }
  async answerHelp() {
    return [
      'I\'m your space guide! I can help with:',
      '🌠 Meteor showers & observing tips',
      '⭐ Constellations & star patterns',
      '☄️ Comets & space objects',
      '🪐 Planets & telescope advice',
      '📸 Astrophotography tips',
      '🌙 Moon phases & viewing conditions',
      '',
      'Try asking: "What is a meteor shower?" or "How do I photograph meteors?"'
    ].join('\n');
  }
  async answerTopic(key) {
    const entry = this.kb?.[key];
    if (!entry) return 'I could not find that topic. Try "topics" to see what I cover.';
    return `${entry.title}: ${entry.text}`;
  }
  async answerUpcoming() {
    const cache = localStorage.getItem('meteorData');
    if (!cache) return 'I could not find cached meteor data yet. Try refreshing the events.';
    const { data } = JSON.parse(cache);
    const now = new Date();
    const upcoming = data
      .filter(s => new Date(s.peak || s.peakDate) >= now)
      .sort((a,b) => new Date(a.peak || a.peakDate) - new Date(b.peak || b.peakDate))
      .slice(0,5);
    if (upcoming.length === 0) return 'No upcoming showers in the cached dataset.';
    return upcoming.map(s => `${s.name} — peak ${new Date(s.peak || s.peakDate).toDateString()} (ZHR ${s.zhr})`).join('\n');
  }
  async answerBestTime() {
    const now = new Date();
    const sunset = new Date(now); sunset.setHours(18,30,0,0);
    const sunrise = new Date(now); sunrise.setDate(sunrise.getDate()+1); sunrise.setHours(6,30,0,0);
    const bestStart = new Date(sunset); bestStart.setHours(bestStart.getHours()+2);
    const peakStart = new Date(sunset); peakStart.setHours(peakStart.getHours()+4);
    const peakEnd = new Date(sunrise); peakEnd.setHours(peakEnd.getHours()-2);
    return `Best start around ${bestStart.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Peak viewing between ${peakStart.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} and ${peakEnd.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}.`;
  }
  async answerWeather() {
    if (!this.location) return 'I need your location permission to check weather for meteor viewing.';
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.location.lat}&lon=${this.location.lon}&appid=demo&units=metric`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('weather');
      const w = await res.json();
      const cloud = w.clouds?.all ?? 0;
      const visKm = (w.visibility ?? 10000)/1000;
      const cond = w.weather?.[0]?.description || 'clear sky';
      const score = Math.max(0, Math.min(100, Math.round(100 - cloud*0.6 - (visKm<5?20:0))));
      return `Sky: ${cond}, cloud cover ${cloud}%, visibility ${visKm} km. Estimated viewing score: ${score}/100.`;
    } catch {
      return 'Weather API is unavailable right now. Please try again later.';
    }
  }
  async answerDefinition(q) {
    const topic = q.replace(/^(what is|define|meaning of|about)\s*/i,'').trim() || 'Meteor shower';
    try {
      const api = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
      const res = await fetch(api);
      if (!res.ok) throw new Error('wiki');
      const j = await res.json();
      const extract = j.extract || 'No summary available.';
      return extract.length > 600 ? extract.slice(0, 600) + '…' : extract;
    } catch {
      return 'I could not fetch a definition right now.';
    }
  }
  async answerRadiant(q) {
    const cache = localStorage.getItem('meteorData');
    if (!cache) return 'I need shower data first. Try refreshing events.';
    const { data } = JSON.parse(cache);
    const match = data.find(s => q.toLowerCase().includes(s.name.toLowerCase()));
    if (!match) return 'Please specify the shower name (e.g., Perseids, Orionids).';
    const dir = match.radiant?.direction || 'Check northeast after midnight';
    return `${match.name} radiant: ${dir}. Best viewing after midnight, look ~45° from radiant.`;
  }
  async answerMoonImpact() {
    const now = new Date();
    const knownNewMoon = new Date('2024-01-11T11:57:00Z');
    const cycle = 29.53059;
    const days = ((now - knownNewMoon)/(1000*60*60*24));
    const c = ((days % cycle)+cycle)%cycle;
    let illum = 50; if (c<1.84566) illum=0; else if(c<5.53699) illum=12; else if(c<9.22831) illum=25; else if(c<12.91963) illum=50; else if(c<16.61096) illum=85; else if(c<20.30228) illum=70; else if(c<23.99361) illum=50; else illum=20;
    let impact = 'Moderate'; if (illum<10) impact='Minimal'; else if (illum<30) impact='Low'; else if (illum>80) impact='High';
    return `Estimated moon illumination ~${illum}%. Impact on meteor visibility: ${impact}. Darker skies near new moon are best.`;
  }
  async answerAPOD() {
    try {
      const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
      if (!res.ok) throw new Error('apod');
      const j = await res.json();
      const title = j.title || 'Astronomy Picture of the Day';
      const url = j.hdurl || j.url || '';
      const desc = (j.explanation || '').slice(0, 300) + (j.explanation && j.explanation.length > 300 ? '…' : '');
      return `${title}\n${url}\n${desc}`;
    } catch {
      return 'APOD is unavailable right now. Please try again later.';
    }
  }
  async answerImageSearch(q) {
    try {
      // Extract search terms after keywords like image/photo/picture/show me
      const cleaned = q.replace(/^(show me|image|photo|picture)\s*(of)?\s*/i, '').trim();
      const term = encodeURIComponent(cleaned || 'meteor shower');
      const api = `https://images-api.nasa.gov/search?q=${term}&media_type=image`;
      const res = await fetch(api);
      if (!res.ok) throw new Error('nasa-images');
      const j = await res.json();
      const items = j.collection && Array.isArray(j.collection.items) ? j.collection.items : [];
      if (!items.length) return `I couldn’t find images for "${cleaned}".`;
      // Pick the first with a link
      const first = items.find(it => Array.isArray(it.links) && it.links[0]?.href) || items[0];
      const title = first.data?.[0]?.title || cleaned || 'NASA Image';
      const href = first.links?.[0]?.href || '';
      return `${title}\n${href}`;
    } catch {
      return 'NASA Images API is unavailable right now. Please try again later.';
    }
  }
  async answerFallback() {
    const suggestions = [
      'I\'m not sure about that yet — but I can tell you about meteors, constellations, or upcoming showers! 🌠',
      'That\'s interesting! I know about meteor showers, planets, comets, and space observation. What would you like to explore? ✨',
      'Hmm, I\'m still learning! I\'m great with meteor showers, star patterns, and space tips though. Try asking about those! 🌟'
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try { new GuideChatbot(); } catch(e) { console.warn('Chatbot init skipped', e); }
});

// ---------- REFRESH BUTTON AND AUTO REFRESH ----------
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-meteor-data');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        refreshBtn.style.transform = '';
        fetchMeteorData();
      }, 150);
    });
  }
});

// Auto refresh every 6 hours (more frequent updates)
setInterval(() => {
  const cache = localStorage.getItem("meteorData");
  if (cache) {
    const { time } = JSON.parse(cache);
    if (Date.now() - time > 6 * 60 * 60 * 1000) {
      console.log("Auto-refreshing meteor data...");
      fetchMeteorData();
    }
  }
}, 30 * 60 * 1000); // check every 30 minutes

/* ================================
   🌠 METEOR CANVAS ANIMATION
   ================================ */
class MeteorAnimation {
  constructor() {
    this.canvas = document.getElementById('meteor-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.meteors = [];
    this.stars = [];
    this.init();
  }

  init() {
    this.resizeCanvas();
    this.createStars();
    this.animate();
   
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createStars() {
    this.stars = [];
    const numStars = 100;
    for (let i = 0; i < numStars; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2,
        opacity: Math.random()
      });
    }
  }

  createMeteor() {
    if (Math.random() < 0.02) { // 2% chance per frame
      this.meteors.push({
        x: Math.random() * this.canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        life: 1,
        decay: Math.random() * 0.02 + 0.01,
        size: Math.random() * 3 + 1
      });
    }
  }

  updateMeteors() {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const meteor = this.meteors[i];
      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      meteor.life -= meteor.decay;

      if (meteor.life <= 0 || meteor.y > this.canvas.height) {
        this.meteors.splice(i, 1);
      }
    }
  }

  drawStars() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.stars.forEach(star => {
      this.ctx.globalAlpha = star.opacity;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }

  drawMeteors() {
    this.meteors.forEach(meteor => {
      const gradient = this.ctx.createLinearGradient(
        meteor.x, meteor.y,
        meteor.x - meteor.vx * 10, meteor.y - meteor.vy * 10
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.life})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
     
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = meteor.size;
      this.ctx.beginPath();
      this.ctx.moveTo(meteor.x, meteor.y);
      this.ctx.lineTo(meteor.x - meteor.vx * 10, meteor.y - meteor.vy * 10);
      this.ctx.stroke();
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
   
    this.createMeteor();
    this.updateMeteors();
    this.drawStars();
    this.drawMeteors();
   
    requestAnimationFrame(() => this.animate());
  }
}
