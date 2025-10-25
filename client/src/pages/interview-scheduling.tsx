
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { Calendar as CalendarIcon, Clock, Video } from "lucide-react";

export default function InterviewScheduling() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  
  return (
    <div className="min-h-screen bg-background">
      <RecruiterNavbar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" />
              Schedule Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Meeting Link</label>
                  <Input placeholder="Google Meet / Zoom link" />
                </div>
                <Button className="w-full">
                  <Video className="w-4 h-4 mr-2" />
                  Send Calendar Invite
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
