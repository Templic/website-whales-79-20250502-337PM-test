
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Player } from "@lottiefiles/react-lottie-player";
import { ArrowRight, Music, Users, Calendar, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Stars from "@/components/Stars";
import MusicPlayer from "@/components/MusicPlayer";

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  comment: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Astra Nova",
    avatar: "https://i.pravatar.cc/150?img=32",
    comment: "The cosmic vibrations from this music have completely transformed my meditation practice. I feel more connected to the universe than ever before.",
    rating: 5
  },
  {
    id: 2,
    name: "Zephyr Moon",
    avatar: "https://i.pravatar.cc/150?img=11",
    comment: "These cosmic healing tracks helped me through a difficult time in my life. The community here is so supportive and understanding.",
    rating: 5
  },
  {
    id: 3,
    name: "Orion Star",
    avatar: "https://i.pravatar.cc/150?img=59",
    comment: "I've been searching for music that resonates with my spiritual journey, and I've finally found it here. Pure cosmic energy!",
    rating: 4
  }
];

interface MusicRelease {
  id: number;
  title: string;
  image: string;
  releaseDate: string;
  description: string;
}

const latestReleases: MusicRelease[] = [
  {
    id: 1,
    title: "Cosmic Meditation",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=870&auto=format&fit=crop",
    releaseDate: "2023-05-15",
    description: "A journey through cosmic soundscapes designed to heal and elevate consciousness."
  },
  {
    id: 2,
    title: "Astral Journey",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1472&auto=format&fit=crop",
    releaseDate: "2023-08-21",
    description: "Connect with higher planes of existence through these ethereal cosmic vibrations."
  },
  {
    id: 3,
    title: "Healing Vibrations",
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=774&auto=format&fit=crop",
    releaseDate: "2023-11-03",
    description: "Immerse yourself in the healing frequencies of the universe with this transformative album."
  }
];

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  image: string;
}

const upcomingEvents: Event[] = [
  {
    id: 1,
    title: "Cosmic Healing Concert",
    date: "2024-07-15",
    location: "Sedona, Arizona",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1470&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Astral Projection Workshop",
    date: "2024-08-22",
    location: "Virtual Event",
    image: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?q=80&w=870&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Sound Bath Healing Session",
    date: "2024-09-10",
    location: "Joshua Tree, California",
    image: "https://images.unsplash.com/photo-1601900249340-3cf7fa9ce029?q=80&w=1470&auto=format&fit=crop"
  }
];

const Index = () => {
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowFloatingPlayer(true);
      } else {
        setShowFloatingPlayer(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <Stars />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-cosmic-gradient opacity-70 z-0"></div>
        <div className="absolute inset-0 bg-cosmic-glow z-0"></div>
        
        <div className="cosmic-container relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-cosmic-light via-cosmic-primary to-cosmic-blue bg-clip-text text-transparent">
                  Connect with Cosmic Healing Through Music
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl">
                Join our community of cosmic travelers seeking healing, connection, and transformation through the power of vibrational music.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button className="cosmic-button text-lg px-8 py-6">
                  Explore Music
                </Button>
                <Button variant="outline" className="border-cosmic-primary text-cosmic-primary hover:bg-cosmic-primary/10 text-lg px-8 py-6">
                  Join Community
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center md:justify-end">
              <div className="relative w-72 h-72 md:w-96 md:h-96">
                <Player
                  autoplay
                  loop
                  src="https://lottie.host/3c0f3cb3-01e1-46bb-ac77-bd9799608aec/BN6g0FeCcI.json"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 relative">
        <div className="cosmic-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
                Discover Cosmic Healing
              </span>
            </h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Our platform offers a holistic approach to healing and connection through music and community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="cosmic-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-full bg-cosmic-primary/10 flex items-center justify-center mb-4">
                    <Music className="h-6 w-6 text-cosmic-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Cosmic Music</h3>
                  <p className="text-muted-foreground">
                    Experience healing vibrations through carefully crafted cosmic soundscapes.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cosmic-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-full bg-cosmic-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-cosmic-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Vibrant Community</h3>
                  <p className="text-muted-foreground">
                    Connect with like-minded souls on similar healing journeys.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cosmic-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-full bg-cosmic-primary/10 flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-cosmic-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Healing Events</h3>
                  <p className="text-muted-foreground">
                    Join transformative live events, workshops, and ceremonies.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cosmic-card">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-full bg-cosmic-primary/10 flex items-center justify-center mb-4">
                    <ShoppingBag className="h-6 w-6 text-cosmic-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Cosmic Merchandise</h3>
                  <p className="text-muted-foreground">
                    Wear and share the cosmic vibrations with our curated merchandise.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Music Player Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-cosmic-gradient opacity-40 z-0"></div>
        <div className="absolute inset-0 bg-cosmic-glow z-0"></div>
        
        <div className="cosmic-container relative z-10">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
                  Experience Healing Vibrations
                </span>
              </h2>
              <p className="text-lg text-foreground/80 mb-8">
                Our cosmic music is carefully crafted to align with specific healing frequencies, 
                promoting relaxation, balance, and spiritual awakening. Listen to our latest 
                releases and feel the transformation.
              </p>
              <Link to="/music">
                <Button className="cosmic-button flex items-center gap-2">
                  Explore Full Library <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="w-full lg:w-1/2">
              <MusicPlayer />
            </div>
          </div>
        </div>
      </section>
      
      {/* Tabs Section */}
      <section className="py-16">
        <div className="cosmic-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
                Discover What's New
              </span>
            </h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Stay updated with our latest releases, upcoming events, and community highlights.
            </p>
          </div>
          
          <Tabs defaultValue="music" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="music" className="text-sm sm:text-base">Latest Releases</TabsTrigger>
              <TabsTrigger value="events" className="text-sm sm:text-base">Upcoming Events</TabsTrigger>
              <TabsTrigger value="testimonials" className="text-sm sm:text-base">Community Voices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="music" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestReleases.map((release) => (
                  <Card key={release.id} className="cosmic-card overflow-hidden">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={release.image} 
                        alt={release.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-cosmic-primary mb-1">{formatDate(release.releaseDate)}</span>
                        <h3 className="text-xl font-semibold mb-2">{release.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{release.description}</p>
                        <Link to="/music" className="text-cosmic-primary hover:text-cosmic-vivid flex items-center gap-1 text-sm font-medium">
                          Listen Now <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="events" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="cosmic-card overflow-hidden">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-cosmic-primary mb-1">{formatDate(event.date)}</span>
                        <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{event.location}</p>
                        <Link to="/events" className="text-cosmic-primary hover:text-cosmic-vivid flex items-center gap-1 text-sm font-medium">
                          Learn More <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="testimonials" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((testimonial) => (
                  <Card key={testimonial.id} className="cosmic-card">
                    <CardContent className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center mb-4">
                          <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                            <img 
                              src={testimonial.avatar} 
                              alt={testimonial.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold">{testimonial.name}</h4>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={14} 
                                  className={i < testimonial.rating ? "text-cosmic-vivid fill-cosmic-vivid" : "text-muted"}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm italic">"{testimonial.comment}"</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-cosmic-gradient opacity-40 z-0"></div>
        <div className="absolute inset-0 bg-cosmic-glow z-0"></div>
        
        <div className="cosmic-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cosmic-light to-cosmic-primary bg-clip-text text-transparent">
                Join Our Cosmic Community Today
              </span>
            </h2>
            <p className="text-lg text-foreground/80 mb-8">
              Connect with like-minded cosmic travelers, access exclusive content, and be the first to hear about new releases and events.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button className="cosmic-button text-lg px-8 py-6">
                Sign Up Now
              </Button>
              <Button variant="outline" className="border-cosmic-primary text-cosmic-primary hover:bg-cosmic-primary/10 text-lg px-8 py-6">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {showFloatingPlayer && <MusicPlayer minimized />}
      
      <Footer />
    </div>
  );
};

export default Index;
