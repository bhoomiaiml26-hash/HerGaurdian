import mongoose from 'mongoose';

const incidentReportSchema = new mongoose.Schema({
  location: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      'harassment',
      'poor_lighting',
      'isolated_area',
      'stalking',
      'verbal_abuse',
      'theft',
      'unsafe_area',
      'street_incident',
      'other'
    ]
  },
  severity: {
    type: Number,
    required: true,
    min: 1,
    max: 3,
    enum: [1, 2, 3] // 1: low, 2: medium, 3: high
  },
  timeOfDay: {
    type: String,
    required: true,
    enum: ['morning', 'afternoon', 'evening', 'night', 'late-night']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 5184000 // Auto-delete after 60 days (5184000 seconds) to keep data fresh
  }
}, {
  timestamps: true
});

// Index for spatial queries
incidentReportSchema.index({ 'location.lat': 1, 'location.lng': 1 });
// Index for time-based filtering
incidentReportSchema.index({ createdAt: -1 });
// Index for category filtering
incidentReportSchema.index({ category: 1 });

const IncidentReport = mongoose.model('IncidentReport', incidentReportSchema);

export default IncidentReport;
