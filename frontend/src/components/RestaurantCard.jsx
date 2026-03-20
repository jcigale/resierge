import './RestaurantCard.css'

const LIKELIHOOD_CONFIG = {
  'Easy': { label: 'Easy to Book', className: 'likelihood-easy' },
  'Moderate': { label: 'Book Ahead', className: 'likelihood-moderate' },
  'Difficult': { label: 'Hard to Get', className: 'likelihood-difficult' },
  'Very Difficult': { label: 'Very Hard to Get', className: 'likelihood-very-difficult' },
}

const PLATFORM_CONFIG = {
  opentable: { label: 'OpenTable', icon: '📋' },
  resy: { label: 'Resy', icon: '🍽' },
  tock: { label: 'Tock', icon: '🎟' },
}

function buildReservationUrl(platform, restaurantName, groupSize, diningDate, diningTime) {
  const name = encodeURIComponent(restaurantName)
  const covers = groupSize || 2

  if (platform === 'opentable') {
    const dt = diningDate && diningTime
      ? `${diningDate}T${diningTime}`
      : diningDate
        ? `${diningDate}T19:00`
        : ''
    const dateParam = dt ? `&dateTime=${encodeURIComponent(dt)}` : ''
    return `https://www.opentable.com/s/?covers=${covers}${dateParam}&term=${name}`
  }
  if (platform === 'resy') {
    const dateParam = diningDate ? `&date=${diningDate}` : ''
    return `https://resy.com/cities/ny?seats=${covers}${dateParam}`
  }
  if (platform === 'tock') {
    return `https://www.exploretock.com/search?q=${name}`
  }
  return null
}

export default function RestaurantCard({ restaurant: r, rank, groupSize, diningDate, diningTime }) {
  const likelihood = r.reservation_likelihood ? LIKELIHOOD_CONFIG[r.reservation_likelihood] : null
  const platforms = (r.reservation_platforms || []).filter(p => p !== 'walk-in')

  return (
    <div className="restaurant-card fade-in">
      <div className="card-top">
        <div className="card-header">
          <div className="card-rank">#{rank}</div>
          <div className="card-meta">
            <h3 className="card-name">{r.name}</h3>
            <div className="card-badges">
              <span className="badge badge-cuisine">{r.cuisine}</span>
              <span className="badge badge-price">{r.price_range}</span>
              <span className="badge badge-neighborhood">{r.neighborhood}</span>
              {likelihood && (
                <span className={`badge badge-likelihood ${likelihood.className}`}>
                  {likelihood.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {r.why_recommended && (
          <div className="card-why">
            <span className="why-icon">✦</span>
            <p>{r.why_recommended}</p>
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-columns">
          {/* Left column */}
          <div className="card-col">
            {r.highlights?.length > 0 && (
              <div className="card-detail">
                <h4>Highlights</h4>
                <ul className="detail-list">
                  {r.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {r.dietary_accommodations?.length > 0 && (
              <div className="card-detail">
                <h4>Dietary Accommodations</h4>
                <div className="accom-tags">
                  {r.dietary_accommodations.map((a, i) => (
                    <span key={i} className="accom-tag">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="card-col">
            {r.address && (
              <div className="card-detail">
                <h4>Address</h4>
                <p className="detail-text">{r.address}</p>
              </div>
            )}

            {r.reservation_likelihood && (
              <div className="card-detail">
                <h4>Reservation Outlook</h4>
                <p className="detail-text">{r.reservation_likelihood_reason}</p>
              </div>
            )}

            {r.reservation_tip && (
              <div className="card-detail">
                <h4>How to Book</h4>
                <p className="detail-text detail-book">{r.reservation_tip}</p>
              </div>
            )}

            {r.best_for && (
              <div className="card-detail">
                <h4>Best For</h4>
                <p className="detail-text">{r.best_for}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card-reserve">
          <h4>Reserve a Table</h4>
          <div className="reserve-links">
            {platforms.map(p => {
              const config = PLATFORM_CONFIG[p]
              if (!config) return null
              const url = buildReservationUrl(p, r.name, groupSize, diningDate, diningTime)
              return (
                <a
                  key={p}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reserve-btn"
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </a>
              )
            })}
            {r.reservation_platforms?.includes('walk-in') && (
              <span className="reserve-walkin">Walk-ins welcome</span>
            )}
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(r.name + ' NYC reservation')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="reserve-btn reserve-btn-secondary"
            >
              <span>🔍</span>
              <span>Search</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
