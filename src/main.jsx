import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import products from './data/products.json';
import './style.css';
import './react.css';

const baseUrl = import.meta.env.BASE_URL || '/';
const basePath = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '');

const withBase = (href = '/') => {
  if (/^(https?:|data:|blob:)/i.test(href)) return href;
  const cleanHref = href.startsWith('/') ? href : `/${href}`;
  return `${basePath}${cleanHref}`;
};

const asset = (src = '') => {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  const cleanSrc = src.replace(/^\/+/, '');
  return withBase(`/assets/${cleanSrc}`);
};

const appLink = (href = '') => {
  if (!href) return '#';
  if (/^https?:/i.test(href)) return href;
  if (href.startsWith('/')) return href;
  return asset(href);
};

const money = (value) => Number(value || 0).toFixed(2);

const includesCategory = (product, category) => {
  if (!category) return true;
  const cat = product.category;
  if (!cat) return false;
  const haystack = Array.isArray(cat) ? cat.join(', ') : String(cat);
  return haystack.toLowerCase().includes(String(category).toLowerCase());
};

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

function useRoute() {
  const readRoute = () => {
    const rawPath = window.location.pathname;
    const path = basePath && rawPath.startsWith(basePath)
      ? rawPath.slice(basePath.length) || '/'
      : rawPath || '/';
    return { path, search: window.location.search };
  };

  const [route, setRoute] = useState({
    ...readRoute(),
  });

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (href) => {
    const target = href.startsWith('/') ? withBase(href) : href;
    window.history.pushState({}, '', target);
    setRoute(readRoute());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { ...route, navigate };
}

function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (product) => {
    setCart((current) => {
      const next = [...current];
      const found = next.find((item) => item.name === product.name && item.price === product.price);
      if (found) {
        found.quantity = (found.quantity || 1) + 1;
      } else {
        next.push({ ...product, quantity: 1 });
      }
      return next;
    });
  };

  const removeItem = (index) => {
    setCart((current) => {
      const next = [...current];
      const item = next[index];
      if (!item) return next;
      if ((item.quantity || 1) > 1) item.quantity -= 1;
      else next.splice(index, 1);
      return next;
    });
  };

  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);

  return { cart, addItem, removeItem, count, total };
}

function Link({ href, navigate, children, ...props }) {
  const resolvedHref = href.startsWith('/') ? withBase(href) : href;

  return (
    <a
      href={resolvedHref}
      onClick={(event) => {
        event.preventDefault();
        navigate(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
}

function Header({ navigate, cartCount, onOpenCart }) {
  const surprise = () => {
    const product = products[Math.floor(Math.random() * products.length)];
    navigate(`/product?id=${encodeURIComponent(product.id)}`);
  };

  return (
    <header>
      <div className="top-nav">
        <Link href="/" navigate={navigate}>
          <img src={asset('img/YStore.png')} alt="Yellogo" className="logo" />
        </Link>
        <ul>
          <li><Link href="/" navigate={navigate}>Home</Link></li>
          <li><Link href="/signin" navigate={navigate}>Sign In</Link></li>
          <li><Link href="/about" navigate={navigate}>About Us</Link></li>
          <li
            id="cart-btn"
            style={{ backgroundImage: `url(${asset('img/car.png')})` }}
            onClick={onOpenCart}
            aria-label="Open cart"
            role="button"
            tabIndex="0"
          >
            <span id="cart-count">{cartCount}</span>
          </li>
        </ul>
      </div>
      <div className="top-nav2">
        <div className="other-nav">
          <ul>
            <li><Link href="/shop" navigate={navigate}>All</Link></li>
            <li><Link href="/shop?category=Featured" navigate={navigate}>Sponsored</Link></li>
            <li><Link href="/shop?category=Holiday" navigate={navigate}>Holiday</Link></li>
            <li><Link href="/shop?category=Food" navigate={navigate}>Food</Link></li>
            <li><Link href="/shop?category=Pricey" navigate={navigate}>Pricey</Link></li>
            <li><Link href="/shop?category=Cheepy" navigate={navigate}>Cheepy</Link></li>
            <li><a id="surprise-link" onClick={surprise}>Surprise Me</a></li>
          </ul>
        </div>
      </div>
    </header>
  );
}

function CartSidebar({ cart, total, removeItem, isOpen, onClose, navigate }) {
  return (
    <>
      <div id="cart-overlay" className={`cart-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
      <div id="cart-sidebar" className={`cart-sidebar ${isOpen ? 'show' : ''}`}>
        <div className="cart-sidebar-header">
          <h2><Link href="/cart" navigate={navigate}>Your Cart</Link></h2>
          <button id="sidebar-close" onClick={onClose}>X</button>
        </div>
        <div id="sidebar-items">
          {cart.length === 0 && <p>Your cart is empty.</p>}
          {cart.map((item, index) => {
            const qty = item.quantity || 1;
            return (
              <div className="cart-item-row" key={`${item.name}-${index}`}>
                <img src={asset(item.image)} alt={item.name} />
                <div className="cart-item-copy">
                  <strong>{item.name} {qty > 1 && <span>×{qty}</span>}</strong>
                  <span>${money(Number(item.price) * qty)}</span>
                </div>
                <button onClick={() => removeItem(index)}>X</button>
              </div>
            );
          })}
        </div>
        <div className="sidebar-footer">
          <div className="cart-total-row">
            <span>Total:</span>
            <span>$<span id="sidebar-total">{money(total)}</span></span>
          </div>
        </div>
      </div>
    </>
  );
}

function ProductCard({ product, navigate }) {
  return (
    <div className="itemcontainer" onClick={() => navigate(`/product?id=${encodeURIComponent(product.id)}`)}>
      <div className="pic">
        <img src={asset(product.iconimage)} alt={product.name} />
      </div>
      <div className="producname">{product.name}</div>
      <div className="description">{product.description}</div>
      <div className="price">${money(product.price)}</div>
    </div>
  );
}

function ProductGrid({ items, navigate }) {
  return (
    <div className="grid">
      {items.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
    </div>
  );
}

function Home({ navigate }) {
  const picked = useMemo(() => ({
    featured: shuffle(products.filter((p) => includesCategory(p, 'Featured'))).slice(0, 5),
    holiday: shuffle(products.filter((p) => includesCategory(p, 'Holiday'))).slice(0, 5),
    food: shuffle(products.filter((p) => includesCategory(p, 'Food'))).slice(0, 5),
    random: shuffle(products).slice(0, 5),
  }), []);

  return (
    <main>
      <h1 className="bigtext">Welcome to The Yellow Store</h1>
      <section><h2>Sponsored Products</h2><ProductGrid items={picked.featured} navigate={navigate} /></section>
      <section><h2>Holiday Products</h2><ProductGrid items={picked.holiday} navigate={navigate} /></section>
      <section><h2>Food Products</h2><ProductGrid items={picked.food} navigate={navigate} /></section>
      <section><h2>Random Products</h2><ProductGrid items={picked.random} navigate={navigate} /></section>
    </main>
  );
}

function Shop({ search, navigate }) {
  const category = new URLSearchParams(search).get('category') || '';
  const items = products.filter((product) => includesCategory(product, category));

  return (
    <main>
      <h1>{category ? `${category} Products` : 'Products'}</h1>
      <ProductGrid items={items} navigate={navigate} />
    </main>
  );
}

function Stars({ rating }) {
  const full = Math.floor(Number(rating || 0));
  const half = Number(rating || 0) % 1 >= 0.5;
  let stars = ''.padStart(full, '★');
  if (half) stars += '☆';
  while (stars.length < 5) stars += '☆';
  return <span className="avg-stars">{stars}</span>;
}

function ProductPage({ search, navigate, addItem }) {
  const id = new URLSearchParams(search).get('id');
  const product = products.find((item) => String(item.id) === String(id));
  const images = product ? (product.altImages?.length ? product.altImages : [product.iconimage]) : [];
  const [selectedImage, setSelectedImage] = useState(images[0] || '');
  const [sideAdOpen, setSideAdOpen] = useState(false);
  const [startAdOpen, setStartAdOpen] = useState(false);
  const [skipSeconds, setSkipSeconds] = useState(5);

  useEffect(() => {
    setSelectedImage(images[0] || '');
  }, [id]);

  useEffect(() => {
    if (!product?.adVisual?.type || product.adType === 'None') return;
    if (product.adType === 'Side') setTimeout(() => setSideAdOpen(true), 10);
    if (product.adType === 'Start') {
      setStartAdOpen(true);
      setSkipSeconds(5);
    }
  }, [product?.id]);

  useEffect(() => {
    if (!startAdOpen || skipSeconds <= 0) return undefined;
    const timer = setTimeout(() => setSkipSeconds((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [startAdOpen, skipSeconds]);

  if (!product) {
    return <main><h1>Product Not Found</h1></main>;
  }

  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;
  const related = products.filter((item) => item.id !== product.id && product.associate?.includes(item.id));
  const ad = product.adVisual || {};

  return (
    <>
      {startAdOpen && (
        <div className="ad-fullscreen">
          <div className="ad-content"><AdVisual visual={ad} navigate={navigate} /></div>
          <button className="ad-skip" onClick={() => skipSeconds <= 0 && setStartAdOpen(false)}>
            {skipSeconds > 0 ? `Skip in ${skipSeconds}` : 'X'}
          </button>
        </div>
      )}
      {sideAdOpen && (
        <div id="ad-side" className="show">
          <div id="ad-side-content"><AdVisual visual={ad} navigate={navigate} /></div>
          <button id="ad-close" onClick={() => setSideAdOpen(false)}>X</button>
        </div>
      )}
      <div className="product">
        <div className="image-area">
          <div className="versions">
            {images.map((src) => (
              <img
                key={src}
                src={asset(src)}
                alt={product.name}
                className={src === selectedImage ? 'active' : ''}
                onMouseEnter={() => setSelectedImage(src)}
                onClick={() => setSelectedImage(src)}
              />
            ))}
          </div>
          <img id="product-img" src={asset(selectedImage)} alt={product.name} />
        </div>
        <div className="stuff">
          <h1>{product.name}</h1>
          <br />Ships from and sold by:<br /> <strong>{product.owner}</strong>
          <br /><br />Age: <strong>{product.age}</strong>
          <div className="section">
            <h3>Details:</h3>
            <p>{product.details}</p>
          </div>
        </div>
        <div className="buy">
          <div className="productprice">
            ${money(product.price)}<br />
            <span>{product.exist}</span> Exist
          </div>
          <p style={{ color: 'rgb(117, 180, 0)' }}>In Stock</p>
          <button className="add-to-cart" onClick={() => addItem({
            name: product.name,
            price: Number(product.price) || 0,
            image: product.iconimage,
            thumbnail: product.iconimage,
          })}>Add to Cart</button>
        </div>
      </div>
      <section className="related-products">
        <h2>Related Items</h2>
        {related.length ? <div className="related-grid">{related.map((item) => <ProductCard key={item.id} product={item} navigate={navigate} />)}</div> : <p>No related items.</p>}
      </section>
      <section className="reviews">
        <h2>Customer Reviews {reviews.length ? <><Stars rating={average} /> ({average.toFixed(1)}/5.0)</> : '(No reviews yet)'}</h2>
        {reviews.length === 0 && <p>No reviews yet.</p>}
        {reviews.map((review, index) => (
          <div className="review" key={`${review.name}-${index}`}>
            <h4>{review.title}</h4>
            <div className="stars"><Stars rating={review.rating} /></div>
            <div className="name">by {review.name}</div>
            <div className="details">{review.details}</div>
          </div>
        ))}
      </section>
    </>
  );
}

function AdVisual({ visual, navigate }) {
  if (!visual?.type || !visual?.src) return null;
  const content = visual.type === 'video'
    ? <video src={asset(visual.src)} controls autoPlay />
    : <img src={asset(visual.src)} alt="" />;
  if (!visual.link) return content;

  const href = appLink(visual.link);
  const isInternal = href.startsWith('/');
  const resolvedHref = isInternal ? withBase(href) : href;

  return (
    <a
      href={resolvedHref}
      onClick={(event) => {
        if (!isInternal || !navigate) return;
        event.preventDefault();
        navigate(href);
      }}
    >
      {content}
    </a>
  );
}

function CartPage({ cart, total, removeItem, navigate }) {
  return (
    <main className="cart-page">
      <h1>Your Shopping Cart</h1>
      <div id="cart-items">
        {cart.length === 0 && <p>Your cart is empty. <Link href="/shop" navigate={navigate}>Start shopping</Link>!</p>}
        {cart.map((item, index) => {
          const qty = item.quantity || 1;
          return (
            <div className="cart-page-row" key={`${item.name}-${index}`}>
              <img src={asset(item.image)} alt={item.name} />
              <div>
                <h3>{item.name} {qty > 1 && <span>×{qty}</span>}</h3>
                <p>${money(Number(item.price) * qty)}</p>
              </div>
              <button onClick={() => removeItem(index)}>Remove</button>
            </div>
          );
        })}
      </div>
      <div className="cart-page-total">
        <h2>Total: $<span>{money(total)}</span></h2>
        <button>Proceed to Nothing</button>
      </div>
    </main>
  );
}

function About({ navigate }) {
  return (
    <article className="site-content">
      <h1>About Us</h1>
      <div className="content-section">
        <h2>Concept</h2>
        <p>The concept was not actually based off of nothing. It was inspired by Omega Mart and The Awesome Store, more of the former. It was given lore, story, and concepts over Winter Break, however they weren't entirely acted upon.</p>
        <h2>Further On</h2>
        <p>If you couldn't see, the website is up online. I plan to continue working on it, adding more products, making the planned ads, including lore, especially un-AIing the website (in both scripts and images), etc.</p>
        <h2>The Store</h2>
        <p>The Yellow Store is an interdimensional store, picking up both products and customers across realities to provide the most across worlds.</p>
        <img src={asset('img/YStore.png')} alt="Logo" />
      </div>
      <Link className="yellow-button" href="/contact" navigate={navigate}>Contact Us</Link>
    </article>
  );
}

function Contact() {
  return (
    <main className="site-content">
      <div className="contact-section contact-react">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you! Reach out with any questions, feedback, or product inquiries.</p>
        <table>
          <tbody>
            <tr><th>Detail</th><th>Information</th></tr>
            <tr><td>Email</td><td>████████████@gmail.com</td></tr>
            <tr><td>Phone</td><td>935-569-████</td></tr>
          </tbody>
        </table>
        <h2>Send Us a Message</h2>
        <form onSubmit={(event) => event.preventDefault()}>
          <input type="text" name="name" placeholder="Your Name" required />
          <input type="email" name="email" placeholder="Your Email" required />
          <input type="text" name="subject" placeholder="Subject" required />
          <textarea name="message" placeholder="Your Message" required rows="6"></textarea>
          <button type="submit">Send Message</button>
        </form>
        <h2>Job Application</h2>
        <p>Scan the QR code below to apply for a position with The Yellow Store:</p>
        <img src={asset('img/JQR.png')} alt="QR Image" />
      </div>
    </main>
  );
}

function SignIn() {
  const captchaSteps = [
    {
      text: 'Select all words in the paragraph that contain the letter "o". Separate by commas.',
      paragraph: 'In the valley of shadows, every owl speaks in riddles at midnight. The fox waits silently under the moon.',
      validator: (ans) => {
        const words = ['shadows', 'owl', 'fox', 'moon'];
        return words.every((word) => ans.includes(word)) && ans.split(',').length === words.length;
      },
    },
    {
      text: 'Count the vowels in the 5th word of the paragraph and type the number.',
      paragraph: 'In the valley of shadows, every owl speaks in riddles at midnight. The fox waits silently under the moon.',
      validator: (ans) => ans.trim() === '2',
    },
    {
      text: 'Reverse the first word of the paragraph and type it.',
      paragraph: 'In the valley of shadows, every owl speaks in riddles at midnight.',
      validator: (ans) => ans.trim() === 'nI',
    },
    {
      text: 'Type all words longer than 5 letters, separated by spaces.',
      paragraph: 'In the valley of shadows, every owl speaks in riddles at midnight.',
      validator: (ans) => ans.trim() === 'valley shadows speaks riddles midnight',
    },
    {
      text: 'Take the second letters of the first four words and type them together.',
      paragraph: 'In the valley of shadows, every owl speaks in riddles.',
      validator: (ans) => ans.trim() === 'nhaf',
    },
    {
      text: 'Count the number of words that start with a vowel.',
      paragraph: 'In the valley of shadows, every owl speaks in riddles at midnight.',
      validator: (ans) => ans.trim() === '6',
    },
    {
      text: 'Type the 3rd, 5th, and 7th letters of the paragraph, in order (ignore spaces and punctuation).',
      paragraph: 'In the valley of shadows, every owl speaks in riddles.',
      validator: (ans) => ans.trim() === 'tea',
    },
    {
      text: "Take all words containing 's' and reverse each, separated by spaces.",
      paragraph: 'In the valley of shadows, every owl speaks in riddles.',
      validator: (ans) => ans.trim() === 'swodahs skaeps selddir',
    },
    {
      text: "Sum the number of vowels in words containing 'o'.",
      paragraph: 'In the valley of shadows, every owl speaks in riddles at midnight.',
      validator: (ans) => ans.trim() === '3',
    },
    {
      text: "Final mini-math: take the number of letters in 'midnight', multiply by 2 and subtract 5.",
      paragraph: '',
      validator: (ans) => ans.trim() === '11',
    },
  ];

  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [statusOk, setStatusOk] = useState(false);
  const [time, setTime] = useState(50);
  const [slider, setSlider] = useState(50);
  const [sliderDrift, setSliderDrift] = useState(0);
  const current = captchaSteps[step];
  const onFinalStep = step >= captchaSteps.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((currentTime) => {
        const next = currentTime + (Math.random() < 0.3 ? 1 : -1);
        return next <= 0 ? 50 : next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const restartCaptcha = () => {
    setStep(0);
    setAnswer('');
    setStatus('');
    setStatusOk(false);
    setSlider(50);
    setSliderDrift(0);
    setTime(50);
  };

  const submitStep = (event) => {
    event.preventDefault();
    if (current.validator(answer)) {
      setStep((value) => value + 1);
      setAnswer('');
      setStatus('');
      return;
    }
    setStatusOk(false);
    setStatus('Incorrect. Try again.');
  };

  const finishSlider = () => {
    const value = Number(slider.toFixed(2));
    if (value >= 73.4 && value <= 73.44) {
      setStatusOk(true);
      setStatus('Verification complete. Redirecting...');
      setTimeout(() => {
        window.alert('Error: Unexpected verification failure. Please try again.');
        restartCaptcha();
      }, 800);
      return;
    }
    setStatusOk(false);
    setStatus('Failed final step. Restarting...');
    setTimeout(restartCaptcha, 700);
  };

  const updateSlider = (event) => {
    const drift = sliderDrift + (Math.random() * 0.4 - 0.2);
    setSliderDrift(drift);
    setSlider(Math.min(100, Math.max(0, Number(event.target.value) + drift)));
  };

  return (
    <main className="captcha-page">
      <section className="captcha-box">
        <h3>Step <span>{Math.min(step + 1, 10)}</span> of 10 <span className="captcha-timer">{time}</span></h3>
        {!onFinalStep && (
          <form onSubmit={submitStep}>
            <div className="captcha-content">
              {current.text}
              {current.paragraph && <em>{current.paragraph}</em>}
            </div>
            <input
              type="text"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type your answer here"
            />
            <button type="submit">Submit</button>
          </form>
        )}
        {onFinalStep && (
          <div className="captcha-slider">
            <p>Final Step: Drag the slider to exactly 73.42%</p>
            <input type="range" min="0" max="100" step="0.01" value={slider} onChange={updateSlider} />
            <button type="button" onClick={finishSlider}>Finish</button>
          </div>
        )}
        {status && <div className={`captcha-status ${statusOk ? 'ok' : ''}`}>{status}</div>}
      </section>
    </main>
  );
}

function FactoryAd() {
  const [progress, setProgress] = useState(100);
  const videoRef = React.useRef(null);

  useEffect(() => {
    const onMove = (event) => {
      const x = event.touches?.[0]?.clientX ?? event.clientX ?? window.innerWidth;
      const pct = Math.max(0, Math.min(100, (x / window.innerWidth) * 100));
      setProgress(pct);
      const video = videoRef.current;
      if (video?.duration) {
        video.currentTime = ((100 - pct) / 100) * video.duration;
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
    };
  }, []);

  return (
    <main className="ad-page factory-ad">
      <div className="player-card">
        <video ref={videoRef} className="player" src={asset('img/Slap.mp4')} muted preload="auto" playsInline />
        <div className="progress"><i style={{ width: `${progress}%` }}></i></div>
      </div>
    </main>
  );
}

function HackedAd() {
  const [phase, setPhase] = useState(0);
  const [pos, setPos] = useState({ left: '50%', top: '50%' });
  const taunts = ['h3ll0', '25% OFF', 'm1ss3d m3', 'sk1ll 1ssu3', 'F1N4L', 'NOOOO!!!! dang it :('];

  const move = () => {
    setPos({
      left: `${Math.random() * 75 + 5}%`,
      top: `${Math.random() * 70 + 10}%`,
    });
  };

  useEffect(() => {
    if (phase <= 0 || phase >= 5) return undefined;
    const timer = setInterval(move, Math.max(160, 900 - phase * 150));
    return () => clearInterval(timer);
  }, [phase]);

  return (
    <main className={`ad-page hacked-ad ${phase >= 3 ? 'invertAll' : ''}`}>
      <div id="t4unt">{taunts[Math.min(phase, taunts.length - 1)]}</div>
      {phase >= 3 && <video className="hack-bg" src={asset('img/YAAI.mp4')} autoPlay loop playsInline muted />}
      <button
        id="h4ckr"
        style={pos}
        onMouseEnter={move}
        onClick={() => setPhase((current) => Math.min(current + 1, 5))}
      >
        {phase >= 5 ? 'Go Back' : 'Click M3 For Free Fun!!1!'}
      </button>
    </main>
  );
}

function Footer() {
  return <footer><p>All rights reserved to &copy;The Yellow Store.</p></footer>;
}

function SiteAudio({ route }) {
  const audioRef = React.useRef(null);
  const isSignIn = route === '/signin';
  const src = asset(isSignIn ? 'Yw.mp3' : 'sub.mp3');
  const startAt = isSignIn ? 0 : 2;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const playFromStartPoint = () => {
      if (audio.duration && audio.currentTime < startAt) audio.currentTime = startAt;
      audio.play().catch(() => {});
    };

    const onEnded = () => {
      audio.currentTime = startAt;
      audio.play().catch(() => {});
    };

    const onTimeUpdate = () => {
      if (!isSignIn && audio.currentTime > 0 && audio.currentTime < startAt) {
        audio.currentTime = startAt;
      }
    };

    audio.loop = false;
    audio.addEventListener('loadedmetadata', playFromStartPoint);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', playFromStartPoint);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [src, startAt, isSignIn]);

  return <audio ref={audioRef} src={src} preload="auto" />;
}

function normalizePath(path) {
  return path || '/';
}

function App() {
  const { path, search, navigate } = useRoute();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const route = normalizePath(path);

  useEffect(() => {
    const normalized = normalizePath(path);
    if (normalized !== path) {
      window.history.replaceState({}, '', `${normalized}${search}`);
    }
  }, [path, search]);

  return (
    <>
      <CartSidebar
        cart={cart.cart}
        total={cart.total}
        removeItem={cart.removeItem}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        navigate={navigate}
      />
      <Header navigate={navigate} cartCount={cart.count} onOpenCart={() => setCartOpen(true)} />
      <SiteAudio route={route} />
      {route === '/' && <Home navigate={navigate} />}
      {route === '/shop' && <Shop search={search} navigate={navigate} />}
      {route === '/product' && <ProductPage search={search} navigate={navigate} addItem={cart.addItem} />}
      {route === '/cart' && <CartPage cart={cart.cart} total={cart.total} removeItem={cart.removeItem} navigate={navigate} />}
      {route === '/about' && <About navigate={navigate} />}
      {route === '/contact' && <Contact />}
      {route === '/signin' && <SignIn />}
      {route === '/ad/factory' && <FactoryAd />}
      {route === '/ad/h4kd' && <HackedAd />}
      {!['/', '/shop', '/product', '/cart', '/about', '/contact', '/signin', '/ad/factory', '/ad/h4kd'].includes(route) && <Home navigate={navigate} />}
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
