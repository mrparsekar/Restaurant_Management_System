import React from "react";
import { Link } from "react-router-dom";
import bestDishes from "../data/bestDishes";
import "./Home.css";

const Home = () => {
  const heroImage = `${process.env.PUBLIC_URL}/images/butter-chicken.jpg`;

  return (
    <main className="home">
      <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="kicker">Fine Dining. Zero Confusion.</p>
          <h1>Restaurant ordering that feels effortless for guests and staff.</h1>
          <p>
            Browse, order, and track in real time while your team focuses on hospitality.
          </p>
          <div className="hero-actions">
            <Link to="/menu" className="cta primary">Start Ordering</Link>
            <Link to="/orders" className="cta secondary">Track Existing Order</Link>
          </div>
        </div>
      </section>

      <section className="intro-grid">
        <article>
          <h3>Fast table flow</h3>
          <p>Guests can order without waiting for a rush-hour queue.</p>
        </article>
        <article>
          <h3>Live status</h3>
          <p>Order lifecycle is visible from placement to serving.</p>
        </article>
        <article>
          <h3>Kitchen ready</h3>
          <p>Clear, structured order payloads help reduce manual errors.</p>
        </article>
      </section>

      <section className="best-sellers">
        <div className="section-title-row">
          <h2>Most Ordered</h2>
          <Link to="/menu" className="inline-link">Open full menu</Link>
        </div>
        <div className="dish-grid">
          {bestDishes.map((dish) => (
            <article key={dish.id} className="dish">
              <img src={dish.image} alt={dish.name} />
              <h4>{dish.name}</h4>
              <p>{dish.price}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Home;
