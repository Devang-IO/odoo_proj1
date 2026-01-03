"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function DatabaseCheck() {
  const [result, setResult] = useState<string>("");
  const supabase = createClient();

  const checkDatabase = async () => {
    try {
      setResult("Checking database...");
      
      // Get recent leave requests
      const { data, error } = await supabase
        .from("leave_requests")
        .select("id, leave_type, attachment_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) {
        setResult(`❌ Database error: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        setResult("📝 No leave requests found in database");
        return;
      }
      
      let resultText = `📊 Found ${data.length} recent leave requests:\n\n`;
      
      data.forEach((request, index) => {
        resultText += `${index + 1}. ID: ${request.id}\n`;
        resultText += `   Type: ${request.leave_type}\n`;
        resultText += `   Has attachment: ${request.attachment_url ? '✅ YES' : '❌ NO'}\n`;
        if (request.attachment_url) {
          resultText += `   URL: ${request.attachment_url}\n`;
        }
        resultText += `   Created: ${new Date(request.created_at).toLocaleString()}\n\n`;
      });
      
      setResult(resultText);
      
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-medium mb-2">Database Check</h3>
      <Button onClick={checkDatabase} className="mb-2">Check Recent Leave Requests</Button>
      {result && (
        <div className="p-2 bg-gray-100 rounded text-sm max-h-64 overflow-y-auto">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}