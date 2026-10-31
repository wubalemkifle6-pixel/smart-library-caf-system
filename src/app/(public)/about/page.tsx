"use client";
import { Card, CardBody } from "@/components/ui";
import { BookOpen, Target, Eye, Coffee, Users, Award, Wifi, Armchair, BookMarked } from "lucide-react";

export default function AboutPage() {
  const objectives = [
    "Provide access to a diverse collection of books and digital resources",
    "Foster a love of reading and lifelong learning in the community",
    "Create a welcoming third space for study, work, and relaxation",
    "Support students and researchers with excellent facilities",
    "Bring people together through literary events and community programs",
    "Promote local authors and showcase their work",
  ];

  const facilities = [
    { icon: BookOpen, title: "Extensive Collection", desc: "Over 10,000 books across all genres and subjects" },
    { icon: Armchair, title: "Reading Lounges", desc: "Comfortable seating with natural light and quiet zones" },
    { icon: Wifi, title: "High-Speed Wi-Fi", desc: "Free fiber internet throughout the building" },
    { icon: Coffee, title: "In-House Café", desc: "Artisan coffee, teas, and fresh food" },
    { icon: Users, title: "Study Rooms", desc: "Private bookable rooms for groups" },
    { icon: Award, title: "Events & Workshops", desc: "Author talks, book clubs, and writing workshops" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold font-['Playfair_Display'] text-navy-900">
          About Our Library
        </h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          Smart Library & Book Café is a modern community space where literature
          meets lifestyle. We blend the traditional library experience with a
          premium café environment.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Card>
          <CardBody className="p-8">
            <div className="w-14 h-14 rounded-xl bg-navy-100 text-navy-700 flex items-center justify-center mb-5">
              <Target size={28} />
            </div>
            <h2 className="text-2xl font-bold text-navy-900 font-['Playfair_Display']">Our Mission</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              To inspire intellectual curiosity, foster a reading culture, and provide
              an inclusive, welcoming space where all members of the community can
              access knowledge, connect, and unwind — all while enjoying exceptional
              coffee and hospitality.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-8">
            <div className="w-14 h-14 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
              <Eye size={28} />
            </div>
            <h2 className="text-2xl font-bold text-navy-900 font-['Playfair_Display']">Our Vision</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              To become the region's most loved literary destination: a place where
              ideas are born, connections are made, and every visit leaves you feeling
              enriched, refreshed, and inspired.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Objectives */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold font-['Playfair_Display'] text-navy-900 mb-8 text-center">Our Objectives</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {objectives.map((obj, i) => (
            <div key={i} className="flex gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-navy-700 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                {i + 1}
              </div>
              <p className="text-slate-700">{obj}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Facilities */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold font-['Playfair_Display'] text-navy-900 mb-8 text-center">Our Facilities</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="card-hover">
                <CardBody>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center text-white mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{f.desc}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Café */}
      <div className="bg-gradient-to-br from-navy-800 to-navy-950 rounded-2xl p-8 lg:p-12 text-white grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-sm mb-4">
            <Coffee size={14} /> The Café
          </div>
          <h2 className="text-3xl font-bold font-['Playfair_Display']">More than just a library</h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Our in-house café is run by passionate baristas who source beans from
            award-winning local roasters. Whether you need a quick espresso, a long
            study session fueled by cold brew, or a slice of cake with a novel,
            we've got you covered.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 text-slate-200 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Single-origin coffee
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Loose-leaf teas
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Fresh pastries daily
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              Vegan & gluten-free options
            </div>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=700"
          alt="Café"
          className="rounded-xl w-full shadow-2xl"
        />
      </div>
    </div>
  );
}
