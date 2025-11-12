
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MapPin, Clock, Share2, Plus } from "lucide-react";

export default function NetworkingHub() {
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Networking Hub</h1>
            <p className="text-lg text-muted-foreground">
              Discover and create networking events
            </p>
            <Button onClick={() => setShowCreateEvent(!showCreateEvent)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>

          {/* Create Event Form */}
          {showCreateEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Create Networking Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Event Title" />
                <Textarea placeholder="Event Description" />
                <Input type="date" placeholder="Event Date" />
                <Input placeholder="Location" />
                <Button className="w-full">Create Event</Button>
              </CardContent>
            </Card>
          )}

          {/* Events List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sample Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Join us for networking
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Coming Soon</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Virtual</span>
                </div>
                <Button className="w-full" size="sm">
                  Register
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
