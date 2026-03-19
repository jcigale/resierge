import './RestaurantCard.css'

export default function RestaurantCard({ restaurant: r, rank }) {
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
      </div>
    </div>
  )
}
