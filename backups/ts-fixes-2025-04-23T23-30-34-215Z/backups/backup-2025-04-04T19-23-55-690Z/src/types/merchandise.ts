
export interface MerchandiseProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
}

export interface MerchandiseStoryContent {
  heading: string;
  text: string;
  image?: string;
}

export interface MerchandiseStory {
  productId: string;
  title: string;
  description: string;
  image?: string;
  storyContent: MerchandiseStoryContent[];
}
