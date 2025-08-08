import React, { useEffect } from 'react';
import { Calculator, PieChart, GraduationCap, TrendingUp, Brain, Star } from 'lucide-react';
import Spline from '@splinetool/react-spline';
import TextPressure from './TextPressure'; // Import the TextPressure component

const HomePage = () => {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.classList.add('visible');
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    });

    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      observer.observe(featuresSection);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <PieChart size={40} />,
      title: "Expense Tracker",
      description: "Monitor and categorize your expenses effortlessly."
    },
    {
      icon: <Calculator size={40} />,
      title: "Financial Calculator",
      description: "Calculate budgets and forecast your finances."
    },
    {
      icon: <GraduationCap size={40} />,
      title: "Scholarship Finder",
      description: "Find scholarships and grants suitable for you."
    },
    {
      icon: <TrendingUp size={40} />,
      title: "Stocks and Investments",
      description: "Explore investment basics and market trends."
    },
    {
      icon: <Brain size={40} />,
      title: "Quick Quizzes",
      description: "Test your financial knowledge with engaging quizzes."
    },
    {
      icon: <Star size={40} />,
      title: "Resources and Guides",
      description: "Access articles, tips, and financial guides.",
      target: "resources-guides"
    }
  ];

  const testimonials = [
    {
      text: "Budget Buddy has transformed how I manage my finances!",
      author: "Emily R., University of California",
      rating: 5
    },
    {
      text: "I love the scholarship finder feature. It saved me hours of research!",
      author: "Sam D., Harvard University",
      rating: 4.5
    },
    {
      text: "The expense tracker is incredibly easy to use and intuitive.",
      author: "Lisa K, Stanford University",
      rating: 5
    }
  ];

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} className="star" fill="currentColor" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} className="star" fill="currentColor" style={{ opacity: 0.5 }} />);
    }

    return (
      <div className="testimonial-rating">
        {stars}
        <span style={{ marginLeft: '0.25rem' }}>{rating} stars</span>
      </div>
    );
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              {/* Replace the heading and paragraph with the TextPressure component */}
              <TextPressure
                text="Budget Buddy"
                flex={true}
                alpha={false}
                stroke={false}
                width={true}
                weight={true}
                italic={true}
                textColor="#2d5016" // Use your heading color
                strokeColor="#ff0000"
                minFontSize={100}
              />
              <p>
                Your ultimate financial companion designed to help students
                manage their money wisely.
              </p>
              <button className="btn-primary" onClick={scrollToFeatures}>
                Get Started
              </button>
            </div>
            <div className="hero-image">
              <Spline scene="https://prod.spline.design/6CUaAmLi9SsYXWmx/scene.splinecode" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Our Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card fade-in"
                onMouseMove={(e) => {
                  const card = e.currentTarget;
                  const rect = card.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  card.style.setProperty('--mouse-x', `${x}px`);
                  card.style.setProperty('--mouse-y', `${y}px`);
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget;
                  card.style.setProperty('--mouse-x', `50%`);
                  card.style.setProperty('--mouse-y', `50%`);
                }}
              >
                <div style={{ color: '#7cb342', marginBottom: '1rem' }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <button
                  className="btn-outline"
                  onClick={() => {
                    if (feature.target) {
                      const section = document.getElementById(feature.target);
                      if (section) {
                        section.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                >
                  Explore More
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">What Students Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                {renderStars(testimonial.rating)}
                <p>"{testimonial.text}"</p>
                <div className="testimonial-author">{testimonial.author}</div>
              </div>
            ))}
          </div>

          <div className="community-cta">
            <p className="community-text">Join and be a part of the community now!</p>
            <button className="btn-primary">Sign Up</button>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources-guides" className="resources-section">
        <div className="container">
          <h2 className="section-title">Resources and Guides</h2>
          <div className="resources-grid">
            <div className="resource-card">
              <h3>Budgeting Tips for Students</h3>
              <p>Learn More</p>
            </div>
            <div className="resource-card">
              <h3>Understanding Investments</h3>
              <p>Read More</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;