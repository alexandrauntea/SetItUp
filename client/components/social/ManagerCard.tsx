import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ManagerCardProps {
  username: string;
  subtitle?: string;
  type: "incoming" | "outgoing" | "active_as_owner" | "active_as_manager";
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
  loading?: boolean;
}

export const ManagerCard: React.FC<ManagerCardProps> = ({
  username,
  subtitle,
  type,
  onAccept,
  onDecline,
  onCancel,
  onRemove,
  loading = false,
}) => {
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(username)}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.username}>@{username}</Text>
          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : (
            <Text style={styles.subtitle}>
              {type === "incoming" && "Te-a propus drept manager"}
              {type === "outgoing" && "Cerere în așteptare"}
              {type === "active_as_owner" && "Managerul tău activ"}
              {type === "active_as_manager" && "Ești manager pentru acest profil"}
            </Text>
          )}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {type === "incoming" && "Cerere"}
            {type === "outgoing" && "Pending"}
            {type === "active_as_owner" && "Manager"}
            {type === "active_as_manager" && "Subordonat"}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#7000FF" style={styles.loader} />
      ) : (
        <View style={styles.actionsRow}>
          {type === "incoming" && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={onAccept}
                activeOpacity={0.8}
              >
                <Text style={styles.acceptButtonText}>Acceptă</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.declineButton]}
                onPress={onDecline}
                activeOpacity={0.8}
              >
                <Text style={styles.declineButtonText}>Refuză</Text>
              </TouchableOpacity>
            </>
          )}

          {type === "outgoing" && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Anulează cererea</Text>
            </TouchableOpacity>
          )}

          {(type === "active_as_owner" || type === "active_as_manager") && (
            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={onRemove}
              activeOpacity={0.8}
            >
              <Text style={styles.removeButtonText}>Șterge manager</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E1E2D",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#2C2C3E",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3A3A52",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    flex: 1,
  },
  username: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    color: "#A0A0B2",
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#2C2C3E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#9E9EB4",
    fontSize: 11,
    fontWeight: "600",
  },
  loader: {
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: "#7000FF",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  declineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3A3A52",
  },
  declineButtonText: {
    color: "#A0A0B2",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: "#2C2C3E",
  },
  cancelButtonText: {
    color: "#FF4D4D",
    fontWeight: "600",
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: "#2C2C3E",
  },
  removeButtonText: {
    color: "#FF4D4D",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default ManagerCard;
