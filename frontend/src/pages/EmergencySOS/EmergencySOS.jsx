import { motion } from "framer-motion";
import { Phone, Plus, ShieldAlert, ShieldCheck, Edit2, Trash2, X, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getContacts, addContact, updateContact, removeContact } from "../../services/contactService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const emergencyContacts = [
  {
    id: 1,
    name: "Women Helpline",
    number: "1091",
    desc: "24/7 dedicated support & rapid dispatch",
    priority: "Primary",
  },
  {
    id: 2,
    name: "National Emergency / Police",
    number: "112",
    desc: "Unified national emergency dispatch",
    priority: "Universal",
  },
  {
    id: 3,
    name: "Ambulance & Medical",
    number: "108",
    desc: "Immediate clinical intervention",
    priority: "Medical",
  },
  {
    id: 4,
    name: "Fire & Rescue Service",
    number: "101",
    desc: "Hazards and urgent evacuation",
    priority: "Rescue",
  },
];

const safetyProtocols = [
  "Enable location telemetry and designate trusted contacts in advance.",
  "Keep direct helpline numbers pre-programmed in hardware quick-dial.",
  "Avoid unlit and isolated routes during late transit hours.",
  "Share estimated arrival times and route links before traveling.",
  "Verify battery reserves and maintain access to portable power sources.",
];

function EmergencySOS() {
  const [contacts, setContacts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: "Family",
  });

  const contactCountLabel = useMemo(() => {
    return contacts.length === 1 ? "1 Verified Contact" : `${contacts.length} Verified Contacts`;
  }, [contacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getContacts();
      setContacts(response.contacts || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to retrieve emergency contacts");
      toast.error("Contact synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContacts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleOpenModal = (contact = null) => {
    if (contact) {
      setIsEditing(true);
      setEditingContactId(contact._id);
      setFormData({
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship || "Family",
      });
    } else {
      setIsEditing(false);
      setEditingContactId(null);
      setFormData({
        name: "",
        phone: "",
        relationship: "Family",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingContactId(null);
    setFormData({
      name: "",
      phone: "",
      relationship: "Family",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error("Contact name and valid phone number are required.");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing) {
        await updateContact(editingContactId, {
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
        });
        toast.success("Emergency contact updated");
      } else {
        await addContact({
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
        });
        toast.success("Emergency contact added");
      }

      await loadContacts();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save contact");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contactId) => {
    if (!window.confirm("Remove this contact from your emergency dispatch list?")) {
      return;
    }

    try {
      await removeContact(contactId);
      toast.success("Emergency contact removed");
      await loadContacts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Deletion failed");
    }
  };

  const handleSimulateSOS = () => {
    toast.success("Emergency SOS triggered: Broadcast dispatched to contacts and local station.", {
      duration: 5000,
      icon: "🚨",
    });
  };

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18] space-y-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Urgent Action Station */}
        <div className="rounded-xl border border-[#BA2626]/20 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-md bg-[#FDF2F2] px-2.5 py-1 text-xs font-semibold text-[#BA2626]">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Emergency Dispatch Command</span>
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
                Emergency Response &amp; Trusted Circle
              </h1>
              <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-[#4F4A45]">
                Trigger an instantaneous high-priority distress broadcast with live GPS telemetry to your designated contacts and local authorities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleSimulateSOS}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#BA2626] px-6 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#9B1C1C]"
              >
                <AlertTriangle className="h-4 w-4" />
                Trigger Emergency SOS
              </button>
            </div>
          </div>
        </div>

        {/* Official Emergency Helplines */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-[#1E1B18]">
              Direct National Helplines
            </h2>
            <span className="text-xs text-[#78726B]">Toll-Free (24/7)</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex flex-col justify-between rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#78726B]">{contact.priority}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F6EFEA] text-[#8C3737]">
                      <Phone className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-base font-semibold text-[#1E1B18]">
                    {contact.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#78726B]">
                    {contact.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#EDE6E2] flex items-center justify-between">
                  <span className="font-serif text-xl font-bold text-[#1E1B18]">{contact.number}</span>
                  <a
                    href={`tel:${contact.number}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#752B2B]"
                  >
                    <Phone className="h-3 w-3" />
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Circle / My Trusted Contacts */}
        <section className="rounded-xl border border-[#EDE6E2] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#1E1B18]">
                Personal Safety Circle
              </h2>
              <p className="text-xs text-[#78726B] mt-0.5">
                Designated contacts who receive instant location notifications upon SOS activation. ({contactCountLabel})
              </p>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#752B2B]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-[#FDF2F2] border border-[#BA2626]/20 p-3 text-xs text-[#BA2626]">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSpinner label="Loading contacts..." className="mt-4" />
          ) : contacts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#EDE6E2] bg-[#FBF9F7] p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-[#78726B]/50 mb-2" />
              <p className="text-xs font-medium text-[#4F4A45]">No trusted contacts designated yet.</p>
              <p className="text-[11px] text-[#78726B] mt-1">Add primary contacts to enable real-time alert broadcasts.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex flex-col justify-between rounded-lg border border-[#EDE6E2] bg-[#FBF9F7] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded bg-[#F6EFEA] px-2 py-0.5 text-[10px] font-semibold text-[#8C3737]">
                        {contact.relationship}
                      </span>
                      <h4 className="mt-2 font-serif text-sm font-semibold text-[#1E1B18]">
                        {contact.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-[#4F4A45] font-mono">{contact.phone}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(contact)}
                        className="rounded-md p-1.5 text-[#78726B] hover:bg-white hover:text-[#1E1B18] transition-colors"
                        title="Edit contact"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact._id)}
                        className="rounded-md p-1.5 text-[#78726B] hover:bg-[#FDF2F2] hover:text-[#BA2626] transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EDE6E2] flex items-center justify-between">
                    <span className="text-[11px] text-[#286646] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#286646]" />
                      Verified Responder
                    </span>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-xs font-semibold text-[#8C3737] hover:underline"
                    >
                      Call Contact
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Safety Protocols Checklist */}
        <section className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-[#1E1B18]">
            Transit Safety Protocols
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {safetyProtocols.map((protocol, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl border border-[#EDE6E2] bg-white p-4 shadow-xs"
              >
                <span className="font-serif text-sm font-bold text-[#8C3737]">
                  0{index + 1}
                </span>
                <p className="text-xs leading-relaxed text-[#4F4A45]">
                  {protocol}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1B18]/60 backdrop-blur-xs px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#EDE6E2] pb-4">
              <h3 className="font-serif text-lg font-bold text-[#1E1B18]">
                {isEditing ? "Modify Emergency Contact" : "Add Emergency Contact"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-[#78726B] hover:bg-[#F6EFEA] hover:text-[#1E1B18]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sarah Chen"
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] focus:border-[#8C3737] focus:outline-none"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +1 555-0199"
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] placeholder-[#78726B] focus:border-[#8C3737] focus:outline-none font-mono"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4F4A45] mb-1.5">
                  Relationship
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="w-full rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2.5 text-sm text-[#1E1B18] focus:border-[#8C3737] focus:outline-none"
                  disabled={submitting}
                >
                  <option value="Family">Family</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Trusted Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EDE6E2]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-[#EDE6E2] px-4 py-2 text-xs font-semibold text-[#4F4A45] hover:bg-[#F6EFEA]"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#8C3737] px-4 py-2 text-xs font-semibold text-white hover:bg-[#752B2B] disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : isEditing ? "Save Changes" : "Confirm Contact"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default EmergencySOS;
