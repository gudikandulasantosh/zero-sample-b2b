export async function downloadImageFromUrl(url: string, fileName: string) {
  const safeFileName = fileName.trim() || "archetype-image";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Unable to fetch image for download");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${safeFileName}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
    return;
  } catch {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName}.png`;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}
