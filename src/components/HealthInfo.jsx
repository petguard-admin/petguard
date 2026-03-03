import React from 'react';
import { Button } from './ui/Button';

const HealthInfo = () => {
  const healthItems = [
    {
      title: 'Pet Nutrition Guide',
      description: 'Learn about balanced diets for cats and dogs to maintain their health.',
      link: '#'
    },
    {
      title: 'Common Health Issues',
      description: 'Information on preventing and treating common pet health problems.',
      link: '#'
    },
    {
      title: 'Vaccination Schedule',
      description: 'Detailed schedule for vaccinations to protect your pets.',
      link: '#'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Health Information</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {healthItems.map((item, index) => (
            <div key={index} className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground mb-4">{item.description}</p>
              <Button variant="outline" asChild>
                <a href={item.link} target="_blank" rel="noopener noreferrer">View Material</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HealthInfo;
