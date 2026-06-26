import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils';

const DEFAULT_EVENT_BANNER_SRC = '/images/default-event-banner.png';

interface EventBannerImageProps {
    alt: string;
    bannerUrl?: string | null;
    wrapperClassName?: string;
    imageClassName?: string;
}

const resolveBannerSrc = (bannerUrl?: string | null) => {
    return getImageUrl(bannerUrl) || DEFAULT_EVENT_BANNER_SRC;
};

const EventBannerImage: React.FC<EventBannerImageProps> = ({
    alt,
    bannerUrl,
    wrapperClassName = '',
    imageClassName = ''
}) => {
    const [src, setSrc] = useState<string>(() => resolveBannerSrc(bannerUrl));

    useEffect(() => {
        setSrc(resolveBannerSrc(bannerUrl));
    }, [bannerUrl]);

    return (
        <div className={wrapperClassName}>
            <img
                src={src}
                alt={alt}
                className={imageClassName}
                loading="lazy"
                onError={() => {
                    if (src !== DEFAULT_EVENT_BANNER_SRC) {
                        setSrc(DEFAULT_EVENT_BANNER_SRC);
                    }
                }}
            />
        </div>
    );
};

export default EventBannerImage;
