import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "../utils/Axios.js";
import { getUserData, clearUserData } from "../auth/UserContext.jsx";

const CATEGORIES = [
  { value: "Select", label: "Select category" },
  { value: "TECH", label: "Tech" },
  { value: "CULTURAL", label: "Cultural" },
  { value: "SPORTS", label: "Sports" },
  { value: "BUSINESS", label: "Business" },
  { value: "GENERAL", label: "General" },
];

const EMPTY_FORM = {
  title: "",
  desc: "",
  venue: "",
  category: "Select",
  eventDateTime: "",
};

const inputCls =
  "w-full h-10 px-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-zinc-400 transition";

const getId = (e) => e?._id ?? e?.id ?? e?.eventId ?? e?.event_id ?? "";

const getBanner = (e) =>
  e?.bannerImageUrl ?? e?.bannerUrl ?? e?.banner ?? e?.imageUrl ?? "";

const getDateTime = (e) => {
  if (e?.eventDateTime) return String(e.eventDateTime).slice(0, 16);
  if (e?.eventDate && e?.eventTime)
    return `${String(e.eventDate).slice(0, 10)}T${String(e.eventTime).slice(0, 5)}`;
  return "";
};

const toForm = (e) => ({
  title: e?.title ?? "",
  desc: e?.desc ?? "",
  venue: e?.venue ?? "",
  category: e?.category ?? "Select",
  eventDateTime: getDateTime(e),
});

const normalize = (payload) =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.events)
      ? payload.events
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

const Admin = () => {
  const userData = getUserData();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [notifyEveryone, setNotifyEveryone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/events");
      setEvents(normalize(res?.data));
    } catch (err) {
      console.error(err.response?.data ?? err);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.user?.id) {
      fetchEvents();
    }
  }, [userData?.user?.id]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await axios.post("/auth/logout");
    } catch (err) {
      console.error(err.response?.data ?? err);
    } finally {
      clearUserData();
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  const openAdd = () => {
    setMode("add");
    setSelectedId("");
    setForm(EMPTY_FORM);
    setBannerFile(null);
    setBannerPreview("");
    setNotifyEveryone(false);
    setError("");
    setNotifySuccess("");
    setPanelOpen(true);
  };

  const openEdit = (event) => {
    setMode("edit");
    setSelectedId(getId(event));
    setForm(toForm(event));
    setBannerFile(null);
    setBannerPreview(getBanner(event));
    setNotifyEveryone(false);
    setError("");
    setNotifySuccess("");
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setMode("add");
    setSelectedId("");
    setForm(EMPTY_FORM);
    setBannerFile(null);
    setBannerPreview("");
    setNotifyEveryone(false);
    setError("");
    setNotifySuccess("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBanner = (e) => {
    const file = e.target.files?.[0] ?? null;
    setBannerFile(file);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return setError("Event title is required.");
    if (!form.venue.trim()) return setError("Venue is required.");
    if (!form.eventDateTime) return setError("Date & time is required.");
    if (form.category === "Select")
      return setError("Please select a category.");

    setSubmitting(true);
    setError("");
    setNotifySuccess("");

    try {
      const [eventDate = "", rawTime = ""] = form.eventDateTime.split("T");
      const eventTime = rawTime.slice(0, 5);
      const payload = { ...form, eventDate, eventTime };

      let savedId = selectedId;

      if (mode === "add") {
        const res = await axios.post("/events/admin/create", payload);
        savedId = getId(res?.data) ?? getId(res?.data?.event) ?? "";
      } else {
        if (!selectedId) throw new Error("Missing event ID for update.");
        await axios.put(`/events/admin/update/${selectedId}`, payload);
      }

      if (bannerFile && savedId) {
        const fd = new FormData();
        fd.append("image", bannerFile);
        await axios.post(`/events/admin/upload-banner/${savedId}`, fd);
      }

      if (notifyEveryone && savedId) {
        await handleSendReminder(savedId, true);
      }

      await fetchEvents();
      closePanel();
    } catch (err) {
      console.error(err.response?.data ?? err);
      setError(
        err.response?.data?.error ??
          err.response?.data?.message ??
          err.message ??
          "Unable to save event.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!eventId) return setError("Cannot delete: event ID is missing.");
    if (!window.confirm("Delete this event?")) return;
    setDeletingId(eventId);
    setError("");
    try {
      await axios.delete(`/events/admin/delete/${eventId}`);
      await fetchEvents();
    } catch (err) {
      console.error(err.response?.data ?? err);
      setError(
        err.response?.data?.error ??
          err.response?.data?.message ??
          "Unable to delete event.",
      );
    } finally {
      setDeletingId("");
    }
  };


  const handleSendReminder = async (eventId, notifyAll = false) => {
    if (!eventId) return;
    try {
      const res = await axios.post(
        `/events/admin/reminder/${eventId}?notifyAll=${notifyAll}`,
      );
      const { sent = 0 } = res?.data ?? {};
      setNotifySuccess(
        `Notification sent to ${sent} user${sent !== 1 ? "s" : ""}.`,
      );
      setError("");
    } catch (err) {
      console.error(err.response?.data ?? err);
      setError(
        err.response?.data?.error ??
          err.response?.data?.message ??
          "Unable to send notification.",
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {!userData?.user?.id ? (
        <Navigate to="/login" replace />
      ) : (
        <>
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-primary px-4 sm:px-6 shadow-sm">
            <img
              src="https://res.cloudinary.com/dtdix9mey/image/upload/v1777405258/logo_kvfdvg.png"
              alt="CampusLink"
              className="h-10 object-contain cursor-pointer rounded-lg"
            />
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                aria-label="Notifications"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/10 transition-colors"
              >
                <i className="ri-notification-3-line text-xl cursor-pointer" />
              </button>
              <img
                src={
                  userData?.user?.profilePhotoUrl ??
                  `https://ui-avatars.com/api/?name=Admin&background=random`
                }
                alt="Avatar"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-zinc-300"
              />
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Logout"
                className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:border-zinc-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <i className="ri-logout-box-r-line text-base" />
                <span className="hidden sm:inline">
                  {loggingOut ? "Logging out…" : "Logout"}
                </span>
              </button>
            </div>
          </header>

          {/* Main */}
          <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight">
                All Events
              </h1>
              <button
                onClick={openAdd}
                aria-label="Add event"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white shadow hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <i className="ri-add-line text-lg" />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top duration-300">
                <i className="ri-error-warning-line mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <EventSkeleton />
            ) : events.length === 0 ? (
              <EmptyState onAdd={openAdd} />
            ) : (
              <ul className="flex flex-col gap-3">
                {events.map((event) => {
                  const eventId = getId(event);
                  return (
                    <EventCard
                      key={eventId}
                      event={event}
                      deleting={deletingId === eventId}
                      onEdit={() => openEdit(event)}
                      onDelete={() => handleDelete(eventId)}
                      onRemind={() => handleSendReminder(eventId, false)}
                    />
                  );
                })}
              </ul>
            )}
          </main>

          <footer className="py-6 text-center text-xs text-zinc-400">
            Made with ❤️ by{" "}
            <span className="text-blue-500 underline underline-offset-2">
              Team Indecisive
            </span>
          </footer>

          {panelOpen && (
            <EventPanel
              mode={mode}
              form={form}
              bannerPreview={bannerPreview}
              notifyEveryone={notifyEveryone}
              submitting={submitting}
              error={error}
              notifySuccess={notifySuccess}
              onChange={handleChange}
              onBanner={handleBanner}
              onNotify={() => setNotifyEveryone((v) => !v)}
              onSave={handleSave}
              onClose={closePanel}
            />
          )}
        </>
      )}
    </div>
  );
};

const EventCard = ({ event, deleting, onEdit, onDelete, onRemind }) => (
  <li className="rounded-xl border border-zinc-200 bg-primary p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <span className="inline-block mb-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize">
          {event?.category ?? "—"}
        </span>
        <h2 className="text-sm font-semibold leading-snug">
          {event?.title ?? "Untitled Event"}
        </h2>
        <p className="mt-1 text-xs text-text-secondary line-clamp-2">
          {event?.desc ?? "No description."}
        </p>
      </div>
      <div className="shrink-0 flex gap-1">
        <button
          onClick={onRemind}
          aria-label="Send reminder to registered users"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-yellow-50 transition-colors cursor-pointer"
          title="Remind registered users"
        >
          <i className="ri-notification-3-line text-yellow-500" />
        </button>
        <button
          onClick={onEdit}
          aria-label="Edit event"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <i className="ri-edit-2-line text-blue-600" />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete event"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <i className="ri-delete-bin-line text-red-500" />
        </button>
      </div>
    </div>
    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
      <span className="flex items-center gap-1">
        <i className="ri-map-pin-line" />
        <span className="truncate max-w-xs">{event?.venue ?? "—"}</span>
      </span>
      <span className="flex items-center gap-1">
        <i className="ri-calendar-2-line" />
        {event?.eventDate ?? "—"}
        {event?.eventTime ? ` · ${event.eventTime}` : ""}
      </span>
      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-700 font-medium">
        <i className="ri-user-line" />
        {event?.registeredUsers?.length ?? 0}
      </span>
    </div>
  </li>
);

const EventPanel = ({
  mode,
  form,
  bannerPreview,
  notifyEveryone,
  submitting,
  error,
  notifySuccess,
  onChange,
  onBanner,
  onNotify,
  onSave,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
    <div className="w-full sm:max-w-xl bg-primary rounded-t-2xl sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col max-h-[92dvh]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <h2 className="text-base font-semibold">
          {mode === "add" ? "New Event" : "Edit Event"}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <i className="ri-close-line" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-3 flex-1 overflow-y-auto">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-primary">
            Banner Image
          </label>
          <div className="rounded-xl border border-dashed border-zinc-300 overflow-hidden">
            {bannerPreview ? (
              <img
                src={bannerPreview}
                alt="Banner preview"
                className="h-24 w-full object-cover cursor-pointer"
                onClick={(e) =>
                  e.currentTarget.parentElement
                    .querySelector('input[type="file"]')
                    .click()
                }
              />
            ) : (
              <div
                className="flex h-24 items-center justify-center bg-zinc-50 text-xs text-zinc-400 cursor-pointer hover:bg-zinc-100 transition-colors"
                onClick={(e) =>
                  e.currentTarget.parentElement
                    .querySelector('input[type="file"]')
                    .click()
                }
              >
                Click to select image
              </div>
            )}
            <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2">
              <input
                type="file"
                accept="image/*"
                onChange={onBanner}
                hidden
                className="text-xs w-full"
              />
            </div>
          </div>
        </div>

        {/* Fields */}
        <Field label="Event Title">
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            type="text"
            placeholder="e.g. Annual Tech Fest"
            className={inputCls}
          />
        </Field>

        <Field label="Description">
          <textarea
            name="desc"
            value={form.desc}
            onChange={onChange}
            rows={2}
            placeholder="Briefly describe the event…"
            className={`${inputCls} h-auto py-2 resize-none`}
          />
        </Field>

        <Field label="Venue">
          <input
            name="venue"
            value={form.venue}
            onChange={onChange}
            type="text"
            placeholder="e.g. Main Auditorium"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date & Time">
            <input
              name="eventDateTime"
              value={form.eventDateTime}
              onChange={onChange}
              type="datetime-local"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5">
          <div>
            <p className="text-xs font-medium text-text-primary">
              Notify everyone
            </p>
          </div>
          <button
            onClick={onNotify}
            aria-pressed={notifyEveryone}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
              notifyEveryone ? "bg-blue-600" : "bg-zinc-300"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                notifyEveryone ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <i className="ri-error-warning-line mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notifySuccess && (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            <i className="ri-checkbox-circle-line mt-0.5 shrink-0" />
            <span>{notifySuccess}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
        <button
          onClick={onClose}
          className="flex-1 h-10 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={submitting}
          className="flex-1 h-10 rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting
            ? "Saving…"
            : mode === "add"
              ? "Create Event"
              : "Update Event"}
        </button>
      </div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-text-primary">{label}</label>
    {children}
  </div>
);

const EventSkeleton = () => (
  <div className="flex flex-col gap-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-28 rounded-xl bg-zinc-100 animate-pulse"
        style={{ opacity: 1 - i * 0.2 }}
      />
    ))}
  </div>
);

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 py-16 text-center">
    <i className="ri-calendar-event-line text-4xl text-zinc-300" />
    <p className="text-sm text-zinc-500">No events yet.</p>
    <button
      onClick={onAdd}
      className="mt-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors cursor-pointer"
    >
      Create first event
    </button>
  </div>
);

export default Admin;
