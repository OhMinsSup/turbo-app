/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';

import type { CarouselApi } from '@template/ui/carousel';
import { isEmpty } from '@template/libs/assertion';
import { Card, CardContent } from '@template/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@template/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@template/ui/dialog';

import { Icons } from '~/components/icons';

interface SearchResultsImageSectionProps {
  images: string[];
  query?: string;
}

export function SearchResultsImageSection({
  images,
  query,
}: SearchResultsImageSectionProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update the current and count state when the carousel api is available
  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Scroll to the selected index
  useEffect(() => {
    if (api) {
      api.scrollTo(selectedIndex, true);
    }
  }, [api, selectedIndex]);

  if (isEmpty(images)) {
    return <div className="text-muted-foreground">No images found</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {images.slice(0, 4).map((image: string, index: number) => (
        <Dialog key={`dialog-${index.toString()}`}>
          <DialogTrigger asChild>
            <div
              role="presentation"
              className="relative aspect-video w-[calc(50%-0.5rem)] cursor-pointer md:w-[calc(25%-0.5rem)]"
              onClick={() => {
                setSelectedIndex(index);
              }}
            >
              <Card className="h-full flex-1">
                <CardContent className="h-full w-full p-2">
                  {image ? (
                    <img
                      src={image}
                      alt={`thumbnail ${(index + 1).toString()}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted h-full w-full animate-pulse" />
                  )}
                </CardContent>
              </Card>
              {index === 3 && images.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 text-sm text-white/80">
                  <Icons.plusCircle size={24} />
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Search Images</DialogTitle>
              <DialogDescription className="text-sm">{query}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Carousel
                setApi={setApi}
                className="bg-muted max-h-[60vh] w-full"
              >
                <CarouselContent>
                  {images.map((img, idx) => (
                    <CarouselItem key={`carousel-${idx.toString()}`}>
                      <div className="flex h-full items-center justify-center p-1">
                        <img
                          src={img}
                          alt={`thumbnail ${(idx + 1).toString()}`}
                          className="h-auto max-h-[60vh] w-full object-contain"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="absolute inset-8 flex items-center justify-between p-4">
                  <CarouselPrevious className="h-10 w-10 rounded-full shadow focus:outline-none">
                    <span className="sr-only">Previous</span>
                  </CarouselPrevious>
                  <CarouselNext className="h-10 w-10 rounded-full shadow focus:outline-none">
                    <span className="sr-only">Next</span>
                  </CarouselNext>
                </div>
              </Carousel>
              <div className="text-muted-foreground py-2 text-center text-sm">
                {current} of {count}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
