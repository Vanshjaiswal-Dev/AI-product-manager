import Navbar from '../layouts/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';

export default function Landing() {
  return (
    <>
      <Navbar variant="marketing" />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </>
  );
}
