'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { SettingsPanelHead } from '@/components/settings/settings-panel-head';

type DaySchedule = {
  active: boolean;
  start: string;
  end: string;
};

type ScheduleMap = Record<string, DaySchedule>;

const formatTimezone = (tz: string) => {
  try {
    const parts = tz.split('/');
    const region = parts[0].replace(/_/g, ' ');
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    
    // Get the GMT offset
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' });
    const offsetMatch = formatter.format(new Date()).match(/GMT[+-]\d{2}:\d{2}/);
    const offset = offsetMatch ? offsetMatch[0] : '';
    
    return `${city}, ${region} ${offset ? `(${offset})` : ''}`.trim();
  } catch (e) {
    return tz.replace(/_/g, ' ');
  }
};

export function BusinessHoursPanel() {
  const { accountRole, accountId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);
  const [tzSearch, setTzSearch] = useState('');
  const [tzOpen, setTzOpen] = useState(false);

  useEffect(() => {
    try {
      setAvailableTimezones(Intl.supportedValuesOf('timeZone'));
    } catch (e) {
      // Fallback if browser doesn't support it
      setAvailableTimezones(['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London']);
    }
  }, []);
  const [schedule, setSchedule] = useState<ScheduleMap>({
    monday: { active: true, start: '09:00', end: '18:00' },
    tuesday: { active: true, start: '09:00', end: '18:00' },
    wednesday: { active: true, start: '09:00', end: '18:00' },
    thursday: { active: true, start: '09:00', end: '18:00' },
    friday: { active: true, start: '09:00', end: '18:00' },
    saturday: { active: false, start: '09:00', end: '18:00' },
    sunday: { active: false, start: '09:00', end: '18:00' },
  });
  
  const supabase = createClient();
  const isAdmin = accountRole === 'owner' || accountRole === 'admin';

  useEffect(() => {
    async function loadData() {
      if (!accountId) return;
      const { data } = await supabase.from('accounts').select('business_hours').eq('id', accountId).single();
      if (data?.business_hours) {
        if (data.business_hours.timezone) setTimezone(data.business_hours.timezone);
        if (data.business_hours.schedule) setSchedule(data.business_hours.schedule);
      }
      setLoading(false);
    }
    loadData();
  }, [accountId, supabase]);

  const handleSave = async () => {
    if (!accountId) return;
    setSaving(true);
    await supabase.from('accounts').update({
      business_hours: { timezone, schedule }
    }).eq('id', accountId);
    setSaving(false);
  };

  const handleDayChange = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-xl"></div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <SettingsPanelHead
        title="Business Hours"
        description="Configure your workspace operating hours. SLA and response time metrics will automatically pause outside of these hours to ensure agents are not penalized overnight."
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Operating Schedule</CardTitle>
          <CardDescription>
            Set the hours your team is expected to reply to customers. AI Bots will continue to reply 24/7 if configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label>Timezone</Label>
            <Popover open={tzOpen} onOpenChange={setTzOpen}>
              <PopoverTrigger 
                render={
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tzOpen}
                    className="w-full max-w-[380px] justify-between font-normal text-left"
                    disabled={!isAdmin}
                  />
                }
              >
                <span className="truncate">
                  {timezone ? formatTimezone(timezone) : "Select timezone..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0" align="start">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <input
                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search timezone..."
                    value={tzSearch}
                    onChange={(e) => setTzSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-1">
                    {availableTimezones
                      .filter(tz => formatTimezone(tz).toLowerCase().includes(tzSearch.toLowerCase()))
                      .map(tz => (
                        <div
                          key={tz}
                          className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setTimezone(tz);
                            setTzOpen(false);
                          }}
                        >
                          <span className="truncate">{formatTimezone(tz)}</span>
                          {timezone === tz && (
                            <Check className="absolute right-2 h-4 w-4" />
                          )}
                        </div>
                    ))}
                    {availableTimezones.filter(tz => formatTimezone(tz).toLowerCase().includes(tzSearch.toLowerCase())).length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">No timezone found.</div>
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4">
            {days.map(day => (
              <div key={day} className="flex items-center gap-4 p-3 rounded-lg border bg-card/50">
                <div className="w-32 flex items-center gap-3">
                  <Switch 
                    checked={schedule[day].active} 
                    onCheckedChange={(val) => handleDayChange(day, 'active', val)}
                    disabled={!isAdmin}
                  />
                  <span className="capitalize font-medium text-sm">{day}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    type="time" 
                    value={schedule[day].start} 
                    onChange={(e) => handleDayChange(day, 'start', e.target.value)}
                    disabled={!schedule[day].active || !isAdmin}
                    className="w-32"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input 
                    type="time" 
                    value={schedule[day].end} 
                    onChange={(e) => handleDayChange(day, 'end', e.target.value)}
                    disabled={!schedule[day].active || !isAdmin}
                    className="w-32"
                  />
                </div>
              </div>
            ))}
          </div>

          {isAdmin && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Schedule'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
