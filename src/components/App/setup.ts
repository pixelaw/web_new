

// Define a separate async function outside your component
export async function initializeApp(setIsLoading, createClient) {


    await createClient().catch(console.error);
    // Update loading state
    setIsLoading(false);
}