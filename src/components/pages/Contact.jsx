import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";

const Contact = () => {
  const form = useRef();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const [issueType, setIssueType] = useState("");
  const [customIssue, setCustomIssue] = useState("");

  // const sendEmail = (e) => {
  //   e.preventDefault();

  //   setLoading(true);
  //   setSuccess("");

  //   emailjs
  //     .sendForm(
  //       "service_iunfi84",
  //       "template_nae0aqo",
  //       form.current,
  //       "bEVc-L3Z5Q60bD4bu"
  //     )
  //     .then(
  //       () => {
  //         setLoading(false);
  //         setSuccess("Message sent successfully!");
  //         form.current.reset();
  //       },
  //       (error) => {
  //         setLoading(false);
  //         setSuccess("Something went wrong. Try again.");
  //         console.log(error);
  //       }
  //     );
  // };

  const sendEmail = (e) => {
  e.preventDefault();

  setLoading(true);

  const subjectValue =
    issueType === "Other" ? customIssue : issueType;

  const templateParams = {
    name: form.current.name.value,
    email: form.current.email.value,
    subject: subjectValue,
    message: form.current.message.value
  };

  emailjs
    .send(
      "service_iunfi84",
      "template_nae0aqo",
      templateParams,
      "bEVc-L3Z5Q60bD4bu"
    )
    .then(
      () => {
        setLoading(false);
        setSuccess("Message sent successfully!");
        form.current.reset();
        setIssueType("");
        setCustomIssue("");
      },
      (error) => {
        setLoading(false);
        setSuccess("Something went wrong.");
        console.log(error);
      }
    );
};

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-4 py-16 flex justify-center">
      <div className="max-w-3xl w-full">

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold mb-3">
            Contact <span className="text-[var(--accent)]">Us</span>
          </h1>

          <p className="text-[var(--light-text)] text-sm">
            Facing issues with booking, payment or seat layout editor?  
            Send us a message and our support team will respond shortly.
          </p>
        </div>

        {/* Contact Info Cards */}

        <div className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="border border-[var(--border)] p-5 rounded-lg text-center">
            <h3 className="font-semibold mb-2">Email Support</h3>
            <p className="text-sm text-[var(--light-text)]">
              Contact our support team
            </p>
          </div>

          <div className="border border-[var(--border)] p-5 rounded-lg text-center">
            <h3 className="font-semibold mb-2">Technical Help</h3>
            <p className="text-sm text-[var(--light-text)]">
              Issues with seat layout editor
            </p>
          </div>

          <div className="border border-[var(--border)] p-5 rounded-lg text-center">
            <h3 className="font-semibold mb-2">Business Inquiry</h3>
            <p className="text-sm text-[var(--light-text)]">
              Partnership or enterprise solutions
            </p>
          </div>

        </div>

        {/* Contact Form */}

        <form
          ref={form}
          onSubmit={sendEmail}
          className="space-y-6 border border-[var(--border)] p-8 rounded-lg"
        >

          {/* Name */}

          <div>
            <label className="block text-sm mb-1">Your Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Enter your name"
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)]
              focus:outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          {/* Email */}

          <div>
            <label className="block text-sm mb-1">Your Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="Enter your email"
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)]
              focus:outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          {/* Issue Category */}

          <div>
  <label className="block text-sm mb-1">Issue Category</label>

  <select
    value={issueType}
    onChange={(e) => {
      setIssueType(e.target.value);
      if (e.target.value !== "Other") {
        setCustomIssue("");
      }
    }}
    required
    className="w-full px-3 py-2 rounded-md bg-black border border-[var(--border)]
    focus:outline-none focus:border-[var(--accent)] transition"
  >
    <option value="">Select issue type</option>
    <option value="Booking Issue">Booking Issue</option>
    <option value="Payment Issue">Payment Issue</option>
    <option value="Seat Layout Problem">Seat Layout Problem</option>
    <option value="Account/Login Issue">Account/Login Issue</option>
    <option value="Feature Request">Feature Request</option>
    <option value="Other">Other</option>

    
  </select><br /> <br></br>

  {issueType === "Other" && (
  <div>
    <label className="block text-sm mb-1">
      Mention your Issue Type
    </label>

    <input
      type="text"
      required
      value={customIssue}
      onChange={(e) => setCustomIssue(e.target.value)}
      placeholder="Enter your issue type"
      className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)]
      focus:outline-none focus:border-[var(--accent)] transition"
    />
  </div>
)}
</div>

          {/* Message */}

          <div>
            <label className="block text-sm mb-1">Message</label>

            <textarea
              name="message"
              rows="5"
              required
              placeholder="Describe your issue in detail..."
              className="w-full px-3 py-2 rounded-md bg-transparent border border-[var(--border)]
              focus:outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-[var(--accent)] hover:opacity-90 transition"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>

          {/* Success Message */}

          {success && (
            <p className="text-center text-sm text-[var(--green)]">
              {success}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Contact;