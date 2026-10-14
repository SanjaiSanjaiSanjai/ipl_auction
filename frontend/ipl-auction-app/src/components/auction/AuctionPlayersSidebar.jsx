function AuctionPlayersSidebar({
    auctionPlayers,
    loadingPlayers,
    playersError,
    onLoadAuctionPlayers,
}) {
    return (
        <aside className="auction-players-sidebar" aria-label="Auction players">
            <h2>Auction players</h2>
            <p>View the available players for this room’s auction.</p>
            <button
                type="button"
                className="auction-players-button"
                onClick={onLoadAuctionPlayers}
                disabled={loadingPlayers}
            >
                {loadingPlayers ? "Loading players…" : "Auction Players"}
            </button>

            {playersError && <p className="auction-page-error" role="alert">{playersError}</p>}
            {!loadingPlayers && auctionPlayers.length > 0 && (
                <ul className="auction-players-list">
                    {auctionPlayers.map((player) => (
                        <li key={player.playerCode}>
                            <strong>{player.name}</strong>
                            <span>{player.role} · {player.nationality}</span>
                            <span>Base price: {player.basePrice}</span>
                        </li>
                    ))}
                </ul>
            )}
            {!loadingPlayers && auctionPlayers.length === 0 && !playersError && (
                <p className="auction-players-hint">Select the button to load available players.</p>
            )}
        </aside>
    );
}

export default AuctionPlayersSidebar;
