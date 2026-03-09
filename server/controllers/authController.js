const supabase = require("../config/supabase");

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Signup request:", req.body);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password }])
      .select(); // <-- important: returns inserted row(s)

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ message: error.message });
    }

    res.json({
      message: "User created",
      user: data[0], // safe now
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request:", req.body);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // For now, plain password check (later hash it)
    if (data.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login success", user: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};