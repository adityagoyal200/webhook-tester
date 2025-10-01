import React from 'react';

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt?: string;
  className?: string;
};

function Image({
  src,
  alt = "Image Name",
  className = "",
  ...props
}: ImageProps) {

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.src = "/assets/images/no_image.png";
      }}
      {...props}
    />
  );
}

export default Image;
