import { useState } from 'react'
import './PreferenceForm.css'

const DIETARY = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher',
  'Dairy-Free', 'Nut-Free', 'Shellfish-Free', 'Pescatarian',
]

const CUISINES = [
  'Italian', 'Japanese', 'Mexican', 'Indian', 'Chinese',
  'French', 'Mediterranean', 'American', 'Thai', 'Korean',
  'Middle Eastern', 'Spanish', 'Greek', 'Vietnamese', 'Caribbean',
  'Steakhouse', 'Seafood', 'Sushi', 'Pizza', 'Brunch',
]

const ATMOSPHERES = [
  'Romantic', 'Lively / Buzzy', 'Quiet & Intimate', 'Family-Friendly',
  'Outdoor Seating', 'Rooftop', 'Bar Scene', 'Fine Dining',
  'Casual', 'Trendy', 'Classic NYC',
]

const OCCASIONS = [
  'Birthday', 'Anniversary', 'Business Dinner', 'Date Night',
  'Family Gathering', 'Celebration', 'Casual Hang', 'Brunch',
]

const PRICE_RANGES = [
  { value: '$', label: '$', desc: 'Under $20/pp' },
  { value: '$$', label: '$$', desc: '$20–50/pp' },
  { value: '$$$', label: '$$$', desc: '$50–100/pp' },
  { value: '$$$$', label: '$$$$', desc: '$100+/pp' },
]

const NYC_NEIGHBORHOODS = {
  Manhattan: [
    'Midtown', 'Upper East Side', 'Upper West Side', 'Lower East Side',
    'East Village', 'West Village', 'Chelsea', 'SoHo', 'Tribeca',
    'Financial District', 'Harlem', 'Murray Hill', 'Gramercy',
    'Hell\'s Kitchen', 'Flatiron / NoMad',
  ],
  Brooklyn: [
    'Williamsburg', 'DUMBO', 'Park Slope', 'Brooklyn Heights',
    'Greenpoint', 'Bushwick', 'Carroll Gardens', 'Cobble Hill',
    'Crown Heights', 'Bed-Stuy',
  ],
  Queens: ['Astoria', 'Long Island City', 'Flushing', 'Jackson Heights', 'Forest Hills'],
  Bronx: ['Fordham', 'Riverdale', 'Arthur Avenue'],
  'Staten Island': ['St. George', 'Stapleton'],
}

const DEFAULT_FORM = {
  group_size: 2,
  dietary_restrictions: [],
  cuisine_preferences: [],
  location: '',
  price_range: '$$',
  occasion: '',
  atmosphere: [],
  other_notes: '',
}

export default function PreferenceForm({ onSubmit }) {
  const [form, setForm] = useState(DEFAULT_FORM)

  function toggle(field, value) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.location) return
    onSubmit({
      ...form,
      occasion: form.occasion || undefined,
      other_notes: form.other_notes || undefined,
    })
  }

  return (
    <form className="pref-form" onSubmit={handleSubmit}>
      <div className="form-hero">
        <h1>Find Your Table</h1>
        <p>Tell us about your group and we'll find the perfect NYC restaurant match.</p>
      </div>

      {/* Group Size */}
      <section className="form-section">
        <label className="section-label">How many people?</label>
        <div className="size-stepper">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => setForm(f => ({ ...f, group_size: Math.max(1, f.group_size - 1) }))}
            aria-label="Decrease group size"
          >−</button>
          <span className="size-value">{form.group_size}</span>
          <button
            type="button"
            className="stepper-btn"
            onClick={() => setForm(f => ({ ...f, group_size: Math.min(30, f.group_size + 1) }))}
            aria-label="Increase group size"
          >+</button>
          <span className="size-hint">{form.group_size === 1 ? 'person' : 'people'}</span>
        </div>
      </section>

      {/* Dietary Restrictions */}
      <section className="form-section">
        <label className="section-label">Dietary restrictions <span className="optional">optional</span></label>
        <div className="tag-grid">
          {DIETARY.map(d => (
            <button
              key={d}
              type="button"
              className={`tag ${form.dietary_restrictions.includes(d) ? 'tag-active' : ''}`}
              onClick={() => toggle('dietary_restrictions', d)}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* Cuisine */}
      <section className="form-section">
        <label className="section-label">Cuisine preferences <span className="optional">optional</span></label>
        <div className="tag-grid">
          {CUISINES.map(c => (
            <button
              key={c}
              type="button"
              className={`tag ${form.cuisine_preferences.includes(c) ? 'tag-active' : ''}`}
              onClick={() => toggle('cuisine_preferences', c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Location */}
      <section className="form-section">
        <label className="section-label" htmlFor="location">
          Location <span className="required">*</span>
        </label>
        <select
          id="location"
          className="select-input"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          required
        >
          <option value="">Select a neighborhood...</option>
          {Object.entries(NYC_NEIGHBORHOODS).map(([borough, hoods]) => (
            <optgroup key={borough} label={`— ${borough} —`}>
              {hoods.map(h => (
                <option key={h} value={`${h}, ${borough}`}>{h}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </section>

      {/* Price Range */}
      <section className="form-section">
        <label className="section-label">Price range</label>
        <div className="price-grid">
          {PRICE_RANGES.map(p => (
            <button
              key={p.value}
              type="button"
              className={`price-btn ${form.price_range === p.value ? 'price-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, price_range: p.value }))}
            >
              <span className="price-symbol">{p.label}</span>
              <span className="price-desc">{p.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Occasion */}
      <section className="form-section">
        <label className="section-label">Occasion <span className="optional">optional</span></label>
        <div className="tag-grid">
          {OCCASIONS.map(o => (
            <button
              key={o}
              type="button"
              className={`tag ${form.occasion === o ? 'tag-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, occasion: f.occasion === o ? '' : o }))}
            >
              {o}
            </button>
          ))}
        </div>
      </section>

      {/* Atmosphere */}
      <section className="form-section">
        <label className="section-label">Atmosphere <span className="optional">optional</span></label>
        <div className="tag-grid">
          {ATMOSPHERES.map(a => (
            <button
              key={a}
              type="button"
              className={`tag ${form.atmosphere.includes(a) ? 'tag-active' : ''}`}
              onClick={() => toggle('atmosphere', a)}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="form-section">
        <label className="section-label" htmlFor="notes">
          Anything else? <span className="optional">optional</span>
        </label>
        <textarea
          id="notes"
          className="textarea-input"
          placeholder="e.g. need a private room, celebrating a milestone, prefer a place with good wine..."
          value={form.other_notes}
          onChange={e => setForm(f => ({ ...f, other_notes: e.target.value }))}
          rows={3}
        />
      </section>

      <button type="submit" className="submit-btn" disabled={!form.location}>
        <span>Find My Restaurant</span>
        <span className="submit-arrow">→</span>
      </button>
    </form>
  )
}
