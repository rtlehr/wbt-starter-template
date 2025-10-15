class JsonLoader {

  constructor(filePath) {

    this.filePath = filePath;
    this.data = null;

  }

  /**
   * Loads the JSON file from the specified path
   * @returns {Promise<Object>} A Promise that resolves with the JSON data
   */
  async load() {

    try {

      const response = await fetch(this.filePath);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      this.data = await response.json();
      return this.data;

    } catch (error) {

      console.error("❌ Error loading JSON:", error);
      throw error;
      
    }

  }

  /**
   * Simple getter for already loaded data
   */
  getData() {
    return this.data;
  }
}

// Export if using ES modules or bundlers
// export default JsonLoader;

// Example usage (jQuery ready)
/*
$(async function () {
  const loader = new JsonLoader("data/sample.json");

  try {
    const jsonData = await loader.load();
    console.log("✅ JSON Loaded:", jsonData);

    // Display in browser (for testing)
    $("#output").text(JSON.stringify(jsonData, null, 2));
  } catch (err) {
    $("#output").text("Failed to load JSON file.");
  }
});
*/
