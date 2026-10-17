
import { Link } from 'react-router-dom';

function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="eyebrow">OUR STORY</p>
        <h1>Beauty should feel like <span>you.</span></h1>
        <p>
          Not another routine to keep up with. Just good products,
          little discoveries and a chance to make time for yourself.
        </p>
      </section>

      <section className="about-story">
        <div className="about-story-heading">
          <p className="eyebrow">WHY BEAUTYKART</p>
          <h2>It's the little things that make a difference.</h2>
        </div>

        <div className="about-story-copy">
          <p>
            BeautyKart started with a simple idea: finding beauty
            products should be enjoyable, not overwhelming.
          </p>
          <p>
            We bring skincare, makeup, haircare and fragrances
            together in one place, making it easier to explore
            products that fit your preferences and your everyday life.
          </p>
          <p>
            We're building a shopping experience that values clarity,
            convenience and the joy of discovering something new.
          </p>
        </div>
      </section>

      <section className="about-values">
        <article>
          <span>01</span>
          <h3>Keep it simple</h3>
          <p>Clear product information and an easy way to explore.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Make it personal</h3>
          <p>Beauty looks different for everyone, and that's the point.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Shop with confidence</h3>
          <p>A thoughtful experience from browsing to checkout.</p>
        </article>
      </section>

      <section className="about-cta">
        <h2>Ready to find your favourites?</h2>
        <Link className="primary-button" to="/products">
          Explore the collection →
        </Link>
      </section>
    </main>
  );
}

export default About;
