import React from 'react';

const Announcements = () => {
  const announcements = [
    {
      title: 'New Vaccination Guidelines',
      description: 'Updated vaccination schedules for cats and dogs to ensure optimal health.',
      date: 'October 15, 2024'
    },
    {
      title: 'Pet Health Awareness Month',
      description: 'Join us in promoting pet health awareness throughout the month.',
      date: 'October 10, 2024'
    },
    {
      title: 'Free Health Check-up Event',
      description: 'Free health check-ups for registered pets at local clinics.',
      date: 'October 5, 2024'
    }
  ];

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Latest Announcements</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {announcements.map((announcement, index) => (
            <div key={index} className="bg-card p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{announcement.title}</h3>
              <p className="text-muted-foreground mb-4">{announcement.description}</p>
              <p className="text-sm text-muted-foreground">{announcement.date}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Announcements;
