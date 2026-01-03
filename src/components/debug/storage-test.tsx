"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function StorageTest() {
  const [result, setResult] = useState<string>("");
  const supabase = createClient();

  const testStorage = async () => {
    try {
      setResult("Testing storage...");
      
      // List buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        setResult(`Error listing buckets: ${bucketsError.message}`);
        return;
      }
      
      console.log("Available buckets:", buckets);
      
      // Check if attachments bucket exists
      const attachmentsBucket = buckets?.find(bucket => bucket.name === "attachments");
      
      if (!attachmentsBucket) {
        setResult("❌ 'attachments' bucket not found. Available buckets: " + buckets?.map(b => b.name).join(", "));
        return;
      }
      
      setResult("✅ 'attachments' bucket found. Testing upload...");
      
      // Test upload
      const testFile = new Blob(["test content"], { type: "text/plain" });
      const fileName = `test-${Date.now()}.txt`;
      
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(fileName, testFile);
      
      if (uploadError) {
        setResult(`❌ Upload failed: ${uploadError.message}`);
        return;
      }
      
      // Test getting public URL
      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(fileName);
      
      setResult(`✅ Upload successful! URL: ${urlData.publicUrl}`);
      
      // Clean up test file
      await supabase.storage.from("attachments").remove([fileName]);
      
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3 className="font-medium mb-2">Storage Test</h3>
      <Button onClick={testStorage} className="mb-2">Test Storage</Button>
      {result && (
        <div className="p-2 bg-gray-100 rounded text-sm">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}