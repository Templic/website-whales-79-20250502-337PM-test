
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'orbitron': ['Orbitron', 'sans-serif'],
				'rajdhani': ['Rajdhani', 'sans-serif'],
				'space': ['Space Grotesk', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Cosmic theme colors
				cosmic: {
					primary: '#9b87f5',
					secondary: '#7E69AB',
					tertiary: '#6E59A5',
					dark: '#1A1F2C',
					light: '#D6BCFA',
					soft: '#E5DEFF',
					vivid: '#8B5CF6',
					blue: '#33C3F0',
					brightBlue: '#1EAEDB',
					oceanBlue: '#0EA5E9'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-gentle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				},
				'cosmic-spin': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'stars-twinkle': {
					'0%, 100%': { opacity: '0.3' },
					'50%': { opacity: '1' }
				},
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(155,135,245,0.5)' },
          '50%': { boxShadow: '0 0 25px rgba(155,135,245,0.8)' }
        },
        'cosmic-particle': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' }
        },
        'hover-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' }
        }
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'pulse-gentle': 'pulse-gentle 4s ease-in-out infinite',
				'cosmic-spin': 'cosmic-spin 20s linear infinite',
				'stars-twinkle': 'stars-twinkle 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'cosmic-particle': 'cosmic-particle 2s forwards',
        'hover-shimmer': 'hover-shimmer 2s ease infinite'
			},
			backgroundImage: {
				'cosmic-gradient': 'linear-gradient(45deg, #1A1F2C, #33264a, #341d5e)',
				'cosmic-glow': 'radial-gradient(circle, rgba(155,135,245,0.2) 0%, rgba(126,105,171,0.05) 70%, rgba(26,31,44,0) 100%)',
        'nebula-gradient': 'linear-gradient(to right, rgba(155,135,245,0.7), rgba(51,195,240,0.7))'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
