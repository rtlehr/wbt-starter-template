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

