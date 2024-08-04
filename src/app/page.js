'use client'

import { useState, useEffect } from 'react';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/rssData');
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data && data.rss && data.rss.channel && data.rss.channel[0].item && (
        <ul>
          {data.rss.channel[0].item.map((item, index) => (
            <li key={index}>
              <h2>{item.title[0]}</h2>
              <p><strong>Link:</strong> <a href={item.link[0]} target="_blank" rel="noopener noreferrer">{item.link[0]}</a></p>
              <p><strong>Description:</strong> <span dangerouslySetInnerHTML={{ __html: item.description[0] }} /></p>
              <p><strong>Publication Date:</strong> {item.pubDate[0]}</p>
              <p><strong>GUID:</strong> {item.guid[0]}</p>
              <p><strong>DC Date:</strong> {item['dc:date'][0]}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
