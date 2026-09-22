import React from 'react';
import { Users, Compass, Shield, Calendar } from 'lucide-react';

export default function FeedTabs({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'following', label: 'Following Feed', icon: <Users size={16} /> },
    { id: 'discover', label: 'Discover Public', icon: <Compass size={16} /> },
    { id: 'sanghas', label: 'My Circles', icon: <Shield size={16} /> },
    { id: 'gatherings', label: 'Gatherings', icon: <Calendar size={16} /> },
  ];

  return (
    <div className="comm-tabs-bar" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`comm-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            id={`tab-${tab.id}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
