import { Newsletter } from "../Newsletter";
import { SocialLinks } from "../SocialLinks";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/music" className="text-muted-foreground hover:text-primary">Music</a>
              </li>
              <li>
                <a href="/contact" className="text-muted-foreground hover:text-primary">Contact</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <SocialLinks />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <Newsletter />
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Dale The Whale. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
